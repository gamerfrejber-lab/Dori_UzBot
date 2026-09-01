FROM eclipse-temurin:17-jdk-alpine AS build
WORKDIR /app
COPY . .
RUN chmod +x gradlew
RUN ./gradlew build -x test

FROM eclipse-temurin:17-jre-alpine
RUN apk add --no-cache curl
WORKDIR /app
COPY --from=build /app/build/libs/*.jar app.jar
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8080/api/health || exit 1
ENTRYPOINT ["java", \
    "-XX:+UseSerialGC", \
    "-XX:MaxRAMPercentage=75.0", \
    "-XX:+TieredCompilation", \
    "-XX:TieredStopAtLevel=1", \
    "-Xss256k", \
    "-jar", "app.jar"]
