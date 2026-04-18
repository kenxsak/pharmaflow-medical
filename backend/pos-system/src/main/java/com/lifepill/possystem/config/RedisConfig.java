package com.lifepill.possystem.config;


import com.lifepill.possystem.dto.responseDTO.EmployerAuthDetailsResponseDTO;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisPassword;
import org.springframework.data.redis.connection.RedisStandaloneConfiguration;
import org.springframework.data.redis.connection.jedis.JedisClientConfiguration;
import org.springframework.data.redis.connection.jedis.JedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.Jackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;
import org.springframework.util.StringUtils;

import java.net.URI;

@Configuration
@ConditionalOnProperty(prefix = "pharmaflow.redis", name = "enabled", havingValue = "true")
public class RedisConfig {

    @Value("${spring.redis.url:}")
    private String redisUrl;

    @Value("${spring.redis.host}")
    private String redisHost;

    @Value("${spring.redis.port}")
    private int redisPort;

    @Value("${spring.redis.password:}")
    private String redisPassword;

    @Value("${spring.redis.ssl:false}")
    private boolean redisSsl;

    /**
     * Configures the Jedis connection factory for Redis.
     *
     * @return JedisConnectionFactory configured with Redis standalone configuration.
     */
    @Bean
    public JedisConnectionFactory jedisConnectionFactory() {
        RedisStandaloneConfiguration redisStandaloneConfiguration = new RedisStandaloneConfiguration();
        boolean useSsl = redisSsl;

        if (StringUtils.hasText(redisUrl)) {
            URI redisUri = URI.create(redisUrl);
            if (StringUtils.hasText(redisUri.getHost())) {
                redisStandaloneConfiguration.setHostName(redisUri.getHost());
            }
            if (redisUri.getPort() > 0) {
                redisStandaloneConfiguration.setPort(redisUri.getPort());
            }
            if (StringUtils.hasText(redisUri.getUserInfo())) {
                String userInfo = redisUri.getUserInfo();
                String passwordFromUrl = userInfo.contains(":")
                        ? userInfo.substring(userInfo.indexOf(':') + 1)
                        : userInfo;
                if (StringUtils.hasText(passwordFromUrl)) {
                    redisStandaloneConfiguration.setPassword(RedisPassword.of(passwordFromUrl));
                }
            }
            useSsl = useSsl || "rediss".equalsIgnoreCase(redisUri.getScheme());
        } else {
            redisStandaloneConfiguration.setHostName(redisHost);
            redisStandaloneConfiguration.setPort(redisPort);
        }

        if (StringUtils.hasText(redisPassword)) {
            redisStandaloneConfiguration.setPassword(RedisPassword.of(redisPassword));
        }

        JedisClientConfiguration.JedisClientConfigurationBuilder clientConfigurationBuilder =
                JedisClientConfiguration.builder();
        if (useSsl) {
            clientConfigurationBuilder.useSsl();
        }

        return new JedisConnectionFactory(redisStandaloneConfiguration, clientConfigurationBuilder.build());
    }

    /**
     * Configures the Redis template for key-value serialization.
     *
     * @return RedisTemplate configured with String key serializer and Jackson JSON value serializer.
     */
    @Bean
    public RedisTemplate<String, EmployerAuthDetailsResponseDTO> redisTemplate() {
        RedisTemplate<String, EmployerAuthDetailsResponseDTO> redisTemplate = new RedisTemplate<>();
        redisTemplate.setConnectionFactory(jedisConnectionFactory());
        redisTemplate.setKeySerializer(new StringRedisSerializer());
        redisTemplate.setValueSerializer(new Jackson2JsonRedisSerializer<>(EmployerAuthDetailsResponseDTO.class));
        return redisTemplate;
    }
}
