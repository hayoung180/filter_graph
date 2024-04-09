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

                if (header === 'env_time' || header === 'env_date') {
                    columns[header].push(value);
                } else if (!isNaN(parseFloat(value))) {
                    columns[header].push(parseFloat(value)); // 숫자로 변환하여 저장
                } else {
                    columns[header].push(NaN);
                }
            }
        }
        renameKey(columns, 'predict\r', 'predict');
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
        const data = {
            env_time: columns['env_time'],
            env_levelsolar: columns['env_levelsolar'],
            env_slopesolar: columns['env_slopesolar'],
            env_airtemp: columns['env_airtemp'],
            env_modtemp: columns['env_modtemp'],
            env_tilt_degree: columns['env_tilt_degree'],//
            env_direction_degree: columns['env_direction_degree'],//
            predict: columns['predict'],
        };
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));

    }else if (req.url === '/filter_data') {
        
        if (req.method === 'POST'){
            
            let requestData = '';
    
            // 요청 데이터를 받아옴
            req.on('data', chunk => {
                requestData += chunk.toString();
            });
    
            // 요청 데이터를 모두 받았을 때의 처리
            req.on('end', () => {
                try {
                    const parsedData = JSON.parse(requestData);

                    // 클라이언트로부터 받은 데이터를 변수에 저장
                    const start_tilt_degree = parsedData.start_tilt || 0;
                    const end_tilt_degree = parsedData.end_tilt || 180;
                    const start_direction_degree = parsedData.start_direction || 0;
                    const end_direction_degree = parsedData.end_direction || 360;

                    // 데이터 필터링 로직
                    const filteredData = {
                        env_time: [],
                        env_levelsolar: [],
                        env_slopesolar: [],
                        env_airtemp: [],
                        env_modtemp: [],
                        env_tilt_degree: [],
                        env_direction_degree: [],
                        predict: [],
                    };

                    for (let i = 0; i < columns.env_time.length; i++) {
                        const tilt = columns.env_tilt_degree[i];
                        const direction = columns.env_direction_degree[i];

                        if (tilt >= start_tilt_degree && tilt <= end_tilt_degree &&
                            direction >= start_direction_degree && direction <= end_direction_degree) {
                            filteredData.env_time.push(columns.env_time[i]);
                            filteredData.env_levelsolar.push(columns.env_levelsolar[i]);
                            filteredData.env_slopesolar.push(columns.env_slopesolar[i]);
                            filteredData.env_airtemp.push(columns.env_airtemp[i]);
                            filteredData.env_modtemp.push(columns.env_modtemp[i]);
                            filteredData.env_tilt_degree.push(tilt);
                            filteredData.env_direction_degree.push(direction);
                            filteredData.predict.push(columns.predict[i]);
                        }
                    }
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(filteredData));
    
                } catch (error) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Invalid request data.' }));
                }
            })
        }else{
            const data = {
                env_time: columns['env_time'],
                env_levelsolar: columns['env_levelsolar'],
                env_slopesolar: columns['env_slopesolar'],
                env_airtemp: columns['env_airtemp'],
                env_modtemp: columns['env_modtemp'],
                env_tilt_degree: columns['env_tilt_degree'],//
                env_direction_degree: columns['env_direction_degree'],//
                predict: columns['predict'],
            };
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(data));
        }

    }
});

// 서버 실행
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
