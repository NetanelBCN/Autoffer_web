plugins {
    kotlin("jvm") version "1.9.0"
    kotlin("plugin.spring") version "1.9.0"
    id("org.springframework.boot") version "3.2.2"
    id("io.spring.dependency-management") version "1.1.4"
    application // ✅ מוסיף את האפשרות להגדיר mainClass
}

group = "org.socialnetwork"
version = "0.0.1-SNAPSHOT"

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(17)
    }
}

repositories {
    mavenCentral()
}

dependencies {
    // WebFlux - לתמיכה באפליקציה ריאקטיבית עם Spring Webflux
    implementation("org.springframework.boot:spring-boot-starter-webflux")

    // RSocket - עבור RSocket Server
    implementation("org.springframework.boot:spring-boot-starter-rsocket")

    implementation("org.springframework.boot:spring-boot-starter-data-mongodb-reactive")

    // Netty HTTP - חובה לתמיכה ב-Websocket עם RSocket
    implementation("io.projectreactor.netty:reactor-netty-http")


    // Jackson Kotlin - סריאליזציה ודה-סריאליזציה של JSON
    implementation("com.fasterxml.jackson.module:jackson-module-kotlin")

    // Kotlin Reflect (עבור תמיכה ברפלקשן של Kotlin)
    implementation("org.jetbrains.kotlin:kotlin-reflect")
    implementation("io.projectreactor.kotlin:reactor-kotlin-extensions")

    // Kotlin Standard Library
    implementation("org.jetbrains.kotlin:kotlin-stdlib-jdk8")

    // בדיקות Unit test ו-Integration test
    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("io.projectreactor:reactor-test")

    // PDF
    implementation("org.apache.pdfbox:pdfbox:2.0.30")
}

kotlin {
    compilerOptions {
        freeCompilerArgs.addAll("-Xjsr305=strict")
    }
}

// ✅ קובע את הקובץ JAR הסופי
tasks.named<Jar>("bootJar") {
    archiveFileName.set("app.jar")
}

// ✅ מוודא שה- JUnit רץ בצורה נכונה
tasks.withType<Test> {
    useJUnitPlatform()
}

// ✅ מוסיף את mainClass להרצה – החלף בשם הקובץ שלך אם צריך
application {
    mainClass.set("org.socialnetwork.messagingserver.MessagingServerApplicationKt")
}

