const axios = require('axios');

async function testGetGames() {
  try {
    console.log('Fetching games list...');
    
    const response = await axios({
      method: 'get',
      url: 'https://jest.bet:2053/api/games',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer acbdfff1db21afb42d26b959e2436f5f1315637cc096518728ea2755664de8f2'
      },
      params: {
        currency: 'USD'  // optional parameter
      }
    });

    console.log('Games List Success:');
    console.log('Total Games:', response.data.data.length);
    console.log('Sample Game:', response.data.data[0]);
  } catch (error) {
    if (error.response) {
      console.error('Games List Error Response:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      });
    } else {
      console.error('Games List Error:', error.message);
    }
  }
}

async function testPlayerCreate() {
  try {
    const response = await axios({
      method: 'post',
      url: 'https://jest.bet:2053/api/v1/player/create',
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
      url: 'https://jest.bet:2053/api/v1/game/launch',
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

// Test sequence
async function runTests() {
  try {
    console.log('=== Starting Tests ===');
    
    console.log('\n1. Testing Get Games List');
    await testGetGames();
    
    console.log('\n2. Testing Player Creation');
    await testPlayerCreate();
    
    console.log('\n3. Testing Game Launch');
    await testLaunchGame();
    
    console.log('\n=== Tests Completed ===');
  } catch (error) {
    console.error('Test sequence error:', error);
  }
}

runTests(); 
