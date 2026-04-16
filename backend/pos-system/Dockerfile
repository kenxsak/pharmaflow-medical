FROM maven:3.9.6-eclipse-temurin-17-alpine AS builder

WORKDIR /build

COPY pom.xml .

RUN mvn dependency:go-offline -B

COPY src ./src

RUN mvn clean package -DskipTests -B

FROM eclipse-temurin:17-jre-alpine AS runtime

LABEL maintainer="LifePill Development Team"
LABEL version="1.0.0"
LABEL description="LifePill POS System Backend Service"

RUN apk add --no-cache postgresql-client wget

RUN addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup

WORKDIR /app

RUN mkdir -p /app/uploads /app/logs && \
    chown -R appuser:appgroup /app

COPY --from=builder --chown=appuser:appgroup /build/target/*.jar app.jar
COPY --chown=appuser:appgroup docker-entrypoint.sh /app/docker-entrypoint.sh
COPY --chown=appuser:appgroup run-medicine-import.sh /app/run-medicine-import.sh
COPY --chown=appuser:appgroup import-data /app/import-data
COPY --chown=appuser:appgroup import-sql /app/import-sql

RUN chmod +x /app/docker-entrypoint.sh /app/run-medicine-import.sh

USER appuser

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider "http://localhost:${PORT:-8080}/actuator/health/liveness" || exit 1

ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -XX:+UseG1GC"

ENTRYPOINT ["sh", "/app/docker-entrypoint.sh"]
