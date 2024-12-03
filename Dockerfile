# 1. Node.js 이미지를 기반으로 설정
FROM node:18

# 2. 작업 디렉토리 설정
WORKDIR /app

# 3. package.json과 package-lock.json을 먼저 복사하여 의존성 설치
COPY package*.json ./

# 4. 의존성 설치
RUN npm install

# 5. 소스 코드 복사
COPY . .

# 6. 앱 빌드 (production 환경에서 최적화된 빌드 생성)
RUN npm run build

# 7. 앱 실행
CMD ["npm", "start"]

# 8. 컨테이너가 실행할 포트 설정
EXPOSE 3000
