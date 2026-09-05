FROM maven:3.9.6-eclipse-temurin-17-alpine AS builder

WORKDIR /build

COPY pom.xml .

RUN mvn dependency:resolve -B || true

COPY src ./src

RUN mvn clean package -DskipTests -B

FROM eclipse-temurin:17-jre AS runtime

LABEL maintainer="LifePill Development Team"
LABEL version="1.0.0"
LABEL description="LifePill POS System Backend Service"

RUN apt-get update && \
    apt-get install -y --no-install-recommends postgresql-client wget && \
    rm -rf /var/lib/apt/lists/*

RUN groupadd -g 1001 appgroup && \
    useradd -u 1001 -g appgroup -s /bin/sh -m appuser

WORKDIR /app

RUN mkdir -p /app/uploads /app/logs /app/import-data /app/import-sql && \
    chown -R appuser:appgroup /app

COPY --from=builder --chown=appuser:appgroup /build/target/*.jar app.jar
COPY --chown=appuser:appgroup docker-entrypoint.sh /app/docker-entrypoint.sh
COPY --chown=appuser:appgroup run-medicine-import.sh /app/run-medicine-import.sh
COPY --chown=appuser:appgroup import-data /app/import-data
COPY --chown=appuser:appgroup import-sql /app/import-sql

RUN chmod +x /app/docker-entrypoint.sh /app/run-medicine-import.sh

USER appuser

EXPOSE 10000 8080

ENV SPRING_PROFILES_ACTIVE=render
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -XX:TieredStopAtLevel=1 -Djava.security.egd=file:/dev/./urandom"

ENTRYPOINT ["sh", "/app/docker-entrypoint.sh"]
