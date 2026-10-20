FROM eclipse-temurin:17-jdk-alpine AS build
WORKDIR /app

# Install Node.js for frontend build
RUN apk add --no-cache nodejs npm

COPY . .

# Build React frontend -> src/main/resources/static
RUN cd frontend && npm install && npm run build

# Build Spring Boot
RUN chmod +x gradlew
RUN ./gradlew build -x test

FROM eclipse-temurin:17-jre-alpine
RUN apk add --no-cache curl
WORKDIR /app
COPY --from=build /app/build/libs/*.jar app.jar
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8080}/api/health || exit 1
# Xotira chegarasi: foydalanishga qarab haq olinadigan hostingda hisob oshib ketmasin.
# Heap 320 MB, metaspace va JIT kod keshi ham chegaralangan (jami jarayon ~450-500 MB atrofida).
# Xotira tugasa jarayon "yarim tirik" qolmay darhol to'xtaydi — Railway uni o'zi qayta ishga tushiradi.
# Barchasini Railway'da JAVA_TOOL_OPTIONS o'zgaruvchisi bilan qayta belgilash mumkin.
ENV JAVA_TOOL_OPTIONS="-Xmx320m -Xms128m -XX:MaxMetaspaceSize=160m -XX:ReservedCodeCacheSize=64m -XX:MaxDirectMemorySize=64m -XX:+ExitOnOutOfMemoryError"
ENTRYPOINT ["java", \
    "-XX:+UseSerialGC", \
    "-XX:+TieredCompilation", \
    "-XX:TieredStopAtLevel=1", \
    "-Xss256k", \
    "-jar", "app.jar"]
