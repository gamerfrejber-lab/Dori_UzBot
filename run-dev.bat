@echo off
cd /d "%~dp0"
set JAVA_HOME=C:\Users\Suxrob\.jdks\ms-17.0.20
set SPRING_DATASOURCE_URL=jdbc:postgresql://ep-winter-thunder-aykulwdu.c-5.us-east-2.aws.neon.tech:5432/neondb?sslmode=require
set SPRING_DATASOURCE_USERNAME=neondb_owner
set SPRING_DATASOURCE_PASSWORD=npg_kjIyY8He9Mrq
call .\gradlew.bat bootRun --console=plain
