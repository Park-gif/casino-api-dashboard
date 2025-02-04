const axios = require('axios');

async function testPlayerCreate() {
  try {
    const response = await axios({
      method: 'post',
      url: 'http://localhost:5000/api/v1/player/create',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer acbdfff1db21afb42d26b959e2436f5f1315637cc096518728ea2755664de8f2'
      },
      data: {
        username: 'test_player123',
        secret: 'secure_password123'
      }
    });

    console.log('Player Create Success:', response.data);
  } catch (error) {
    if (error.response) {
      console.error('Player Create Error Response:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      });
    } else {
      console.error('Player Create Error:', error.message);
    }
  }
}

async function testLaunchGame() {
  try {
    const requestData = {
      username: 'test_player123',
      secret: 'secure_password123',
      gameid: 'softswiss/DiceBonanza',
      homeurl: 'https://example.com/home',
      cashierurl: 'https://example.com/cashier',
      play_for_fun: 0,
      currency: 'USD',
      lang: 'en'
    };

    console.log('Sending launch game request with data:', requestData);

    const response = await axios({
      method: 'post',
      url: 'http://localhost:5000/api/v1/game/launch',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer acbdfff1db21afb42d26b959e2436f5f1315637cc096518728ea2755664de8f2'
      },
      data: requestData
    });

    console.log('Launch Game Success:', response.data);
  } catch (error) {
    if (error.response) {
      console.error('Launch Game Error Response:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      });
      if (error.response.data.requestData) {
        console.error('Request Data Received by Server:', error.response.data.requestData);
      }
    } else {
      console.error('Launch Game Error:', error.message);
    }
  }
}

// Wait for player creation to complete before launching game
async function runTests() {
  try {
    await testPlayerCreate();
    await testLaunchGame();
  } catch (error) {
    console.error('Test sequence error:', error);
  }
}

runTests(); 
