const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, serverTimestamp } = require('firebase/firestore');

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDcMMaGMCOixe2Cem2LIH05LeRk7bz1I6w",
    authDomain: "prnclub-vn.firebaseapp.com",
    databaseURL: "https://prnclub-vn-default-rtdb.firebaseio.com",
    projectId: "prnclub-vn",
    storageBucket: "prnclub-vn.firebasestorage.app",
    messagingSenderId: "183716957909",
    appId: "1:183716957909:web:2c84ce11972ea7aefa9c5c",
    measurementId: "G-YKEXQH3FGC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Test data
const categories = [
    { name: 'Action', videoCount: 0 },
    { name: 'Comedy', videoCount: 0 },
    { name: 'Drama', videoCount: 0 }
];

const pornstars = [
    { name: 'Actor 1', videoCount: 0 },
    { name: 'Actor 2', videoCount: 0 },
    { name: 'Actor 3', videoCount: 0 }
];

const videos = [
    {
        title: 'Test Video 1',
        description: 'This is a test video',
        thumbnailUrl: 'https://via.placeholder.com/300x200',
        categories: ['Action'],
        actors: ['Actor 1'],
        tags: ['test', 'video'],
        viewCount: 0,
        likeCount: 0,
        createdAt: serverTimestamp()
    },
    {
        title: 'Test Video 2',
        description: 'Another test video',
        thumbnailUrl: 'https://via.placeholder.com/300x200',
        categories: ['Comedy'],
        actors: ['Actor 2'],
        tags: ['test', 'video'],
        viewCount: 0,
        likeCount: 0,
        createdAt: serverTimestamp()
    }
];

async function seedData() {
    try {
        // Add categories
        console.log('Adding categories...');
        for (const category of categories) {
            await addDoc(collection(db, 'categories'), category);
        }
        console.log('Categories added successfully');

        // Add pornstars
        console.log('Adding pornstars...');
        for (const pornstar of pornstars) {
            await addDoc(collection(db, 'pornstars'), pornstar);
        }
        console.log('Pornstars added successfully');

        // Add videos
        console.log('Adding videos...');
        for (const video of videos) {
            await addDoc(collection(db, 'videos'), video);
        }
        console.log('Videos added successfully');

        console.log('All test data added successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error adding test data:', error);
        process.exit(1);
    }
}

// Add test videos
const seedVideos = async () => {
  try {
    console.log('Starting to seed videos...');
    
    const testVideos = [
      {
        title: 'Test Video 1',
        description: 'This is a test video description',
        thumbnailUrl: 'https://via.placeholder.com/300x200',
        categories: ['Action'],
        actors: ['Actor 1'],
        tags: ['test', 'video'],
        viewCount: 100,
        likeCount: 50,
        createdAt: serverTimestamp()
      },
      {
        title: 'Test Video 2',
        description: 'Another test video description',
        thumbnailUrl: 'https://via.placeholder.com/300x200',
        categories: ['Comedy'],
        actors: ['Actor 2'],
        tags: ['test', 'funny'],
        viewCount: 200,
        likeCount: 75,
        createdAt: serverTimestamp()
      },
      {
        title: 'Test Video 3',
        description: 'Third test video description',
        thumbnailUrl: 'https://via.placeholder.com/300x200',
        categories: ['Drama'],
        actors: ['Actor 3'],
        tags: ['test', 'drama'],
        viewCount: 150,
        likeCount: 60,
        createdAt: serverTimestamp()
      }
    ];

    for (const video of testVideos) {
      await addDoc(collection(db, 'videos'), video);
      console.log('Added video:', video.title);
    }

    console.log('Successfully seeded videos!');
  } catch (error) {
    console.error('Error seeding videos:', error);
  }
};

// Run the seeding
seedVideos().then(() => {
  console.log('Seeding completed!');
  process.exit(0);
}).catch(error => {
  console.error('Error during seeding:', error);
  process.exit(1);
}); 