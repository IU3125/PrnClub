import axios from 'axios';
import cheerio from 'cheerio';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    // Fetch the webpage content
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const $ = cheerio.load(response.data);

    // Extract video information
    // Note: You'll need to adjust these selectors based on the target website's structure
    const title = $('meta[property="og:title"]').attr('content') || $('title').text();
    const description = $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content');
    const thumbnailUrl = $('meta[property="og:image"]').attr('content');
    
    // Find iframe code
    const iframeCode = $('iframe').toString() || '';
    
    // Extract categories and actors
    // You'll need to adjust these selectors based on the target website's structure
    const categories = [];
    $('.category-tag, .video-category').each((i, el) => {
      categories.push($(el).text().trim());
    });

    const actors = [];
    $('.actor-tag, .pornstar-name').each((i, el) => {
      actors.push($(el).text().trim());
    });

    // Extract tags
    const tags = [];
    $('.tag-item, .video-tag').each((i, el) => {
      tags.push($(el).text().trim());
    });

    // Return the scraped data
    res.status(200).json({
      title,
      description,
      thumbnailUrl,
      iframeCode,
      categories: [...new Set(categories)], // Remove duplicates
      actors: [...new Set(actors)], // Remove duplicates
      tags: [...new Set(tags)] // Remove duplicates
    });
  } catch (error) {
    console.error('Scraping error:', error);
    res.status(500).json({ error: 'Failed to scrape video information' });
  }
} 