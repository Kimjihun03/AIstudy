// 시간 업데이트
function updateTime() {
    const timeElement = document.getElementById('time');
    const dateElement = document.getElementById('dateInfo');

    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    timeElement.textContent = `${hours}:${minutes}:${seconds}`;

    const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
    const dateStr = now.toLocaleDateString('ko-KR', options);
    dateElement.textContent = dateStr;
}

// 습도 표시 (랜덤 값)
function updateHumidity() {
    const humidity = Math.floor(Math.random() * 40) + 40;
    document.getElementById('humidity').textContent = `습도: ${humidity}%`;
}

// 위치 정보 가져오기
function getLocationWeather() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                const latitude = position.coords.latitude;
                const longitude = position.coords.longitude;
                fetchWeather(latitude, longitude);
            },
            error => {
                console.log('위치 정보 접근 실패, 서울로 기본 설정:', error);
                // 기본값으로 서울 설정
                fetchWeather(37.5665, 126.9780);
            }
        );
    } else {
        console.log('Geolocation을 지원하지 않습니다. 서울로 기본 설정');
        fetchWeather(37.5665, 126.9780);
    }
}

// 날씨 정보 가져오기 (Open-Meteo API 사용 - 무료, API 키 불필요)
async function fetchWeather(latitude, longitude) {
    try {
        const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code,humidity&timezone=auto`
        );
        const data = await response.json();

        if (data.current) {
            const current = data.current;
            const temp = Math.round(current.temperature_2m);
            const humidity = current.humidity;

            document.getElementById('temperature').textContent = `${temp}°C`;

            // 날씨 코드에 따른 설명
            const weatherDesc = getWeatherDescription(current.weather_code);

            document.getElementById('weatherDetails').innerHTML = `
                <div>날씨: ${weatherDesc}</div>
                <div>습도: ${humidity}%</div>
            `;
        }
    } catch (error) {
        console.error('날씨 정보 가져오기 실패:', error);
        document.getElementById('weatherDetails').innerHTML = `
            <div>날씨: 정보 없음</div>
            <div>습도: --</div>
        `;
    }
}

// WMO 날씨 코드 해석
function getWeatherDescription(code) {
    const weatherCodes = {
        0: '맑음',
        1: '대체로 맑음',
        2: '부분흐림',
        3: '흐림',
        45: '안개',
        48: '서리가 낀 안개',
        51: '가벼운 이슬비',
        61: '약한 빗',
        63: '중간 빗',
        65: '강한 빗',
        71: '약한 눈',
        73: '중간 눈',
        75: '강한 눈',
        80: '소나기',
        81: '강한 소나기',
        82: '매우 강한 소나기',
        85: '약한 눈 소나기',
        86: '강한 눈 소나기',
        95: '뇌우'
    };
    return weatherCodes[code] || '날씨 정보';
}

// 샘플 뉴스 데이터
const sampleNews = [
    { title: '인공지능 기술 발전, 새로운 시대 개막', source: '기술뉴스' },
    { title: '국내 IT 산업 성장률 역대 최고 달성', source: '경제일보' },
    { title: '클라우드 서비스 시장 급성장 중', source: '과학동아' },
    { title: '블록체인 기술의 미래는?', source: '테크타임' },
    { title: '모바일 앱 개발 트렌드 2026', source: '개발자뉴스' }
];

// 뉴스 표시
function displayNews() {
    const newsList = document.getElementById('newsList');
    newsList.innerHTML = '';

    sampleNews.slice(0, 3).forEach(news => {
        const newsItem = document.createElement('div');
        newsItem.className = 'news-item';
        newsItem.innerHTML = `
            <div class="news-item-title">${news.title}</div>
            <div class="news-item-source">${news.source}</div>
        `;
        newsList.appendChild(newsItem);
    });
}

// 일정 추가
function addSchedule() {
    const input = document.getElementById('scheduleInput');
    const scheduleText = input.value.trim();

    if (scheduleText === '') {
        alert('일정을 입력해주세요');
        return;
    }

    const scheduleList = document.getElementById('scheduleList');
    const scheduleItem = document.createElement('div');
    scheduleItem.className = 'schedule-item';

    const id = Date.now();
    scheduleItem.innerHTML = `
        <span>${scheduleText}</span>
        <button onclick="deleteSchedule(${id})">삭제</button>
    `;
    scheduleItem.id = `schedule-${id}`;

    scheduleList.appendChild(scheduleItem);
    input.value = '';

    // 로컬 스토리지에 저장
    saveSchedules();
}

// 일정 삭제
function deleteSchedule(id) {
    const element = document.getElementById(`schedule-${id}`);
    if (element) {
        element.remove();
        saveSchedules();
    }
}

// 로컬 스토리지에 일정 저장
function saveSchedules() {
    const schedules = [];
    document.querySelectorAll('.schedule-item').forEach(item => {
        const text = item.querySelector('span').textContent;
        schedules.push(text);
    });
    localStorage.setItem('schedules', JSON.stringify(schedules));
}

// 저장된 일정 불러오기
function loadSchedules() {
    const saved = localStorage.getItem('schedules');
    if (saved) {
        const schedules = JSON.parse(saved);
        schedules.forEach(schedule => {
            const scheduleList = document.getElementById('scheduleList');
            const scheduleItem = document.createElement('div');
            scheduleItem.className = 'schedule-item';

            const id = Date.now() + Math.random();
            scheduleItem.innerHTML = `
                <span>${schedule}</span>
                <button onclick="deleteSchedule(${id})">삭제</button>
            `;
            scheduleItem.id = `schedule-${id}`;

            scheduleList.appendChild(scheduleItem);
        });
    }
}

// 검색 기능
function search() {
    const searchInput = document.getElementById('searchInput');
    const query = searchInput.value.trim();

    if (query !== '') {
        window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank');
        searchInput.value = '';
    }
}

// I'm Feeling Lucky 기능
function feeling() {
    const searchInput = document.getElementById('searchInput');
    const query = searchInput.value.trim();

    if (query !== '') {
        window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}&btnI=1`, '_blank');
        searchInput.value = '';
    }
}

// 엔터 키로 검색
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('searchInput').addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            search();
        }
    });

    document.getElementById('scheduleInput').addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            addSchedule();
        }
    });
});

// 초기화
document.addEventListener('DOMContentLoaded', function() {
    updateTime();
    updateHumidity();
    getLocationWeather();
    displayNews();
    loadSchedules();

    // 매초 시간 업데이트
    setInterval(updateTime, 1000);

    // 매분 습도 업데이트
    setInterval(updateHumidity, 60000);

    // 매 10분마다 날씨 업데이트
    setInterval(getLocationWeather, 600000);
});
