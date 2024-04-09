const fs = require('fs');
const http = require('http');
const chartjs = require('chart.js'); // chart.js 모듈을 불러옵니다.

const fileDir = './env_220404.csv';

function renameKey(obj, oldKey, newKey) {
    if (obj.hasOwnProperty(oldKey)) {
        obj[newKey] = obj[oldKey];
        delete obj[oldKey];
    }
}

const columns = {}; // 전역 변수로 columns 선언

try {
    const contents = fs.readFileSync(fileDir, 'utf-8');
    const lines = contents.split('\n');

    if (lines.length > 0) {
        const headers = lines[0].split(','); // 헤더 추출

        // 각 컬럼명별로 빈 리스트 생성
        for (const header of headers) {
            columns[header] = [];
        }

        // 각 데이터 행을 처리하여 컬럼별로 값 추가
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            const values = line.split(',');

            for (let j = 0; j < headers.length; j++) {
                const header = headers[j];
                const value = values[j];

                if (!isNaN(parseFloat(value))) {
                    columns[header].push(parseFloat(value)); // 숫자로 변환하여 저장
                } else {
                    columns[header].push(NaN);
                }
            }
        }

        renameKey(columns, 'env_airtemp\r', 'env_airtemp');
        console.log(columns); // 'env_index'에 저장된 리스트 출력
    } else {
        console.log('CSV file is empty.');
    }
} catch (err) {
    console.error('Error reading the file:', err);
}

// 서버 생성
const server = http.createServer((req, res) => {
    if (req.url === '/') {
        // index.html 파일을 읽어서 클라이언트에 전송
        fs.readFile('index.html', 'utf-8', (err, content) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/html' });
                res.end('Internal Server Error');
            } else {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(content);
            }
        });
    } else if (req.url === '/data') {
        // 그래프에 필요한 데이터 전송
        const data = {
            env_time: columns['env_time'],
            env_levelsolar: columns['env_levelsolar'],
            env_slopesolar: columns['env_slopesolar'],
            env_airtemp: columns['env_airtemp'],
            env_modtemp: columns['env_modtemp']
        };
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
    }
});

// 서버 실행
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
