# שלב 1: בניית האפליקציה
FROM gradle:8.4.0-jdk17 AS builder

WORKDIR /app

COPY . .

RUN gradle build --no-daemon

# שלב 2: תוצאה סופית – רק הקובץ JAR
FROM openjdk:17-jdk-slim

WORKDIR /app

COPY --from=builder /app/build/libs/app.jar app.jar

EXPOSE 8080

CMD ["java", "-jar", "app.jar"]
