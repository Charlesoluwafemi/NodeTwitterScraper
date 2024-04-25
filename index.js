const puppeteer = require('puppeteer');
const { Pool } = require('pg');
const nodemailer = require('nodemailer'); // Import nodemailer module
const path = require('path');
const fs = require('fs');
const axios = require('axios');





async function scrapePosts() {
    try {
        console.log('Starting scraping process...');

        // Launch Puppeteer
        const browser = await puppeteer.launch({ headless: true });
        console.log('Browser launched successfully.');

        // Open a new page
        const page = await browser.newPage();
        console.log('New page opened successfully.');

        // Set navigation timeout to 60 seconds
        await page.setDefaultNavigationTimeout(60000);

        // Navigate to the Twitter profile page
        const response = await page.goto('https://twitter.com/coindesk');
        if (!response.ok()) {
            throw new Error(`Failed to load page: ${response.status()} - ${response.statusText()}`);
        }
        console.log('Page loaded successfully.');

        // Wait for a moment to ensure all posts are loaded
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Scrape posts
        console.log('Scraping posts...');
        const posts = await page.evaluate(() => {
            const postsData = [];
            const tweetElements = document.querySelectorAll('article');
            tweetElements.forEach(tweetElement => {
                const tweetTextElement = tweetElement.querySelector('[lang]');
                const tweetText = tweetTextElement?.innerText.trim() || 'Tweet text not found';
                const timeElement = tweetElement.querySelector('time');
                const tweetDate = timeElement?.getAttribute('datetime') || 'Date not found';
                const videoElement = tweetElement.querySelector('video');
                const hasVideo = !!videoElement;

                const postData = {
                    text: tweetText,
                    date: tweetDate,
                    hasVideo: hasVideo
                };
                postsData.push(postData);
            });
            return postsData;
        });

        console.log('Scraped posts:', posts);

        // Scrape image URLs
        const imageUrls = await page.evaluate(() => {
            const imageElements = document.querySelectorAll('img');
            const urls = [];
            imageElements.forEach(img => {
                const src = img.getAttribute('src');
                if (src && src.startsWith('https://')) {
                    urls.push(src);
                }
            });
            return urls;
        });

        console.log('Found image URLs:', imageUrls);

        // Create a directory to save images
        const imagesDir = path.join(__dirname, 'images');
        if (!fs.existsSync(imagesDir)) {
            fs.mkdirSync(imagesDir);
        }

        // Download and save images
        console.log('Downloading and saving images...');
        for (let i = 0; i < imageUrls.length; i++) {
            const imageUrl = imageUrls[i];
            const imageName = `image_${i + 1}.jpg`; // You can adjust the filename as needed
            const imagePath = path.join(imagesDir, imageName);
            const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
            fs.writeFileSync(imagePath, imageResponse.data);
            console.log(`Image ${i + 1} saved successfully.`);
        }


        // Check if any post has a video
        const postWithVideo = posts.find(post => post.hasVideo);

        if (postWithVideo) {
            console.log('Post with video found. Sending email...');

            // Create a transporter object using SMTP transport
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: 'copywriter188@gmail.com',
                    pass: 'jmtj hvym oiux hcuh'
                }
            });

            // Define email options
            const mailOptions = {
                from: 'copywriter188@gmail.com',
                to: 'developerteam878@gmail.com',
                subject: 'Post with Video Found',
                text: 'A post with a video has been found during scraping.'
            };

            // Send email
            await transporter.sendMail(mailOptions);
            console.log('Email sent successfully.');
        } else {
            console.log('No post with video found.');
        }

        // Save data to a file
        console.log('Saving data to file...');
        fs.writeFileSync('posts.json', JSON.stringify(posts, null, 2));
        console.log('Data saved successfully.');





        // Connect to the PostgreSQL database
        const pool = new Pool({
            user: 'postgres',
            host: 'localhost',
            database: 'twitterpostdb',
            password: '1234',
            port: 5432
        });

        // Insert scraped posts into the database
       // Insert scraped posts into the database
console.log('Inserting data into the database...');
try {
    // Create the 'posts' table if it doesn't exist
    await pool.query('CREATE TABLE IF NOT EXISTS posts (id SERIAL PRIMARY KEY, text TEXT, date TIMESTAMP)');

    // Iterate over each post and insert it into the 'posts' table
    for (const post of posts) {
        const queryText = 'INSERT INTO posts (text, date) VALUES ($1, $2)';
        const values = [post.text, post.date];
        await pool.query(queryText, values);
        console.log('Post inserted successfully:', post);
    }

    console.log('All posts inserted into the database.');
} catch (error) {
    console.error('Error inserting posts into the database:', error);
}


        // Close the database connection
        await pool.end();
        console.log('Database connection closed.');

        // Close browser
        await browser.close();
        console.log('Browser closed.');

        console.log('Scraping process completed.');
    } catch (error) {
        console.error('Error during scraping process:', error);
    }
}

// Call the function to start scraping
scrapePosts();
