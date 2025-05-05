// script.js
document.addEventListener('DOMContentLoaded', () => {
    initAudioControls();
    initAnnyang();
    const page = document.body.querySelector('main').parentElement.querySelector('h1').textContent;
    if (location.pathname.endsWith('indexAssign2.html') || location.pathname.endsWith('/')) {
      fetchQuote();
    } else if (location.pathname.endsWith('stocksAssign2.html')) {
      setupStocksPage();
    } else if (location.pathname.endsWith('dogsAssign2.html')) {
      setupDogsPage();
    }
  });
  
  function initAudioControls() {
    document.getElementById('audio-on').addEventListener('click', () => {
      if (annyang) annyang.start({ autoRestart: true, continuous: false });
    });
    document.getElementById('audio-off').addEventListener('click', () => {
      if (annyang) annyang.abort();
    });
  }
  
  function initAnnyang() {
    if (!annyang) return;
    const commands = {
      'hello':    () => alert('Hello World'),
      'change the color to *color': (color) => document.body.style.backgroundColor = color,
      'navigate to *page': (page) => window.location.href = page.trim().toLowerCase() + '.html',
      
      'lookup *ticker': (ticker) => {
        if (location.pathname.endsWith('stocksAssign2.html')) {
          document.getElementById('ticker').value = ticker.toUpperCase();
          document.getElementById('range').value = '30';
          fetchStockData();
        }
      },
      
      'load dog breed *breed': (breed) => {
        if (location.pathname.endsWith('dogsAssign2.html')) {
          const btn = Array.from(document.querySelectorAll('#breed-buttons button'))
            .find(b => b.textContent.toLowerCase() === breed.toLowerCase());
          if (btn) btn.click();
        }
      }
    };
    annyang.addCommands(commands);
    annyang.start({ autoRestart: true, continuous: false });
  }
  
  /* Home Page Quotes */
  function fetchQuote() {
    fetch('https://zenquotes.io/api/random')
      .then(res => res.json())
      .then(data => {
        // ZenQuotes returns an array with one quote object:
        //   data[0].q = quote, data[0].a = author
        const q = data[0].q;
        const a = data[0].a;
        document.getElementById('quote').textContent  = `"${q}"`;
        document.getElementById('author').textContent = `— ${a}`;
      })
      .catch(err => {
        console.error('Quote fetch failed:', err);
        document.getElementById('quote').textContent  = 'Sorry, no quote today.';
        document.getElementById('author').textContent = '';
      });
  }
  
  /* Stocks Page */
  function setupStocksPage() {
    document.getElementById('lookup-btn').addEventListener('click', fetchStockData);
    fetchRedditTop();
  }
  function fetchStockData() {
    const ticker = document.getElementById('ticker').value.trim().toUpperCase();
    const days = +document.getElementById('range').value;
    if (!ticker) return;
    const to = new Date();
    const from = new Date(to.getTime() - days * 24*60*60*1000);
    const fmt = d => d.toISOString().split('T')[0];
    const url = `https://api.polygon.io/v2/aggs/ticker/${ticker}/range/1/day/${fmt(from)}/${fmt(to)}?apiKey=_L0GHhLYi8144WvTZuCWt6AuaWfNI5Kp`;
    fetch(url).then(r => r.json()).then(json => {
      const labels = json.results.map(r => new Date(r.t).toLocaleDateString());
      const data = json.results.map(r => r.c);
      drawChart(labels, data, ticker);
    });
  }
  let stockChart;
  function drawChart(labels, data, label) {
    const ctx = document.getElementById('stock-chart').getContext('2d');
    if (stockChart) stockChart.destroy();
    stockChart = new Chart(ctx, {
      type: 'line',
      data: { labels, datasets: [{ label, data }] },
      options: { responsive: true }
    });
  }
  function fetchRedditTop() {
    fetch('https://tradestie.com/api/v1/apps/reddit?date=2022-04-03')
      .then(res => res.json())
      .then(data => {
        const top5 = data
          .sort((a, b) => b.no_of_comments - a.no_of_comments)
          .slice(0, 5);
  
        const tbody = document.querySelector('#reddit-table tbody');
        tbody.innerHTML = ''; 
  
        top5.forEach(item => {
          const tr = document.createElement('tr');
          const icon = item.sentiment === 'Bullish'
            ? '📈'
            : item.sentiment === 'Bearish'
              ? '📉'
              : '';
  
          tr.innerHTML = `
            <td>
              <a href="https://finance.yahoo.com/quote/${item.ticker}"
                 target="_blank">${item.ticker}</a>
            </td>
            <td>${item.no_of_comments}</td>
            <td>${icon}</td>
          `;
          tbody.appendChild(tr);
        });
      })
      .catch(err => console.error('Reddit fetch failed:', err));
  }
  
  /* Dogs Page */
  function setupDogsPage() {
    loadDogImages();
    loadBreeds();
  }
  function loadDogImages() {
    fetch('https://dog.ceo/api/breeds/image/random/10')
      .then(r => r.json())
      .then(json => {
        const slider = document.getElementById('dog-carousel');
        slider.innerHTML = '';
        json.message.forEach(url => {
          const img = document.createElement('img');
          img.src = url;
          slider.appendChild(img);
        });
        simpleslider.getSlider();
      })
      .catch(err => console.error('Dog images failed to load:', err));
  }
  function loadBreeds() {
    fetch('https://api.thedogapi.com/v1/breeds')
      .then(r => r.json())
      .then(breeds => {
        const container = document.getElementById('breed-buttons');
        breeds.forEach(b => {
          const btn = document.createElement('button');
          btn.className = 'btn';
          btn.textContent = b.name;
          btn.addEventListener('click', () => showBreedInfo(b));
          container.appendChild(btn);
        });
      });
  }
  function showBreedInfo(breed) {
    const info = document.getElementById('breed-info');
    const [min, max] = breed.life_span.split(' – ').map(s => s.replace(' years',''));
    info.innerHTML = `
      <h3>${breed.name}</h3>
      <p>${breed.temperament || 'No description available.'}</p>
      <p>Life span: ${min}–${max} years</p>
    `;
    info.style.display = 'block';
  }