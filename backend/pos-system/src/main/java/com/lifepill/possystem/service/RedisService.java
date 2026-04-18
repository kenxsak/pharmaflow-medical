package com.lifepill.possystem.service;

import com.lifepill.possystem.dto.responseDTO.EmployerAuthDetailsResponseDTO;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.Collection;
import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.concurrent.TimeUnit;

@Service
public class RedisService {
    private static final String EMPLOYER_DETAILS_PREFIX = "employer_details::";
    private static final Duration CACHE_TTL = Duration.ofHours(24);

    private final RedisTemplate<String, EmployerAuthDetailsResponseDTO> redisTemplate;
    private final boolean redisEnabled;
    private final ConcurrentMap<String, CachedEmployerDetails> fallbackCache = new ConcurrentHashMap<>();

    public RedisService(
            ObjectProvider<RedisTemplate<String, EmployerAuthDetailsResponseDTO>> redisTemplateProvider,
            @Value("${pharmaflow.redis.enabled:false}") boolean redisEnabled
    ) {
        this.redisTemplate = redisTemplateProvider.getIfAvailable();
        this.redisEnabled = redisEnabled && this.redisTemplate != null;
    }

    public void cacheEmployerDetails(EmployerAuthDetailsResponseDTO employerDetails) {
        String key = buildKey(employerDetails.getEmployerEmail());
        if (usesRedis()) {
            redisTemplate.opsForValue().set(key, employerDetails, 24, TimeUnit.HOURS);
            return;
        }
        fallbackCache.put(key, new CachedEmployerDetails(employerDetails, Instant.now().plus(CACHE_TTL)));
    }

    public EmployerAuthDetailsResponseDTO getEmployerDetails(String username) {
        String key = buildKey(username);
        if (usesRedis()) {
            return redisTemplate.opsForValue().get(key);
        }
        CachedEmployerDetails cachedEmployerDetails = fallbackCache.get(key);
        if (cachedEmployerDetails == null) {
            return null;
        }
        if (cachedEmployerDetails.isExpired()) {
            fallbackCache.remove(key);
            return null;
        }
        return cachedEmployerDetails.employerDetails();
    }

    public void removeEmployerDetails(String username) {
        String key = buildKey(username);
        if (usesRedis()) {
            redisTemplate.delete(key);
            return;
        }
        fallbackCache.remove(key);
    }

    /**
     * Retrieves all cached employer details from Redis.
     *
     * @return A collection of EmployerAuthDetailsResponseDTO representing the cached employer details.
     */
    public Collection<EmployerAuthDetailsResponseDTO> getAllCachedEmployerDetails() {
        Collection<EmployerAuthDetailsResponseDTO> cachedEmployers = new HashSet<>();

        if (usesRedis()) {
            Set<String> keys = redisTemplate.keys(EMPLOYER_DETAILS_PREFIX + "*");
            if (keys == null) {
                return cachedEmployers;
            }
            for (String key : keys) {
                EmployerAuthDetailsResponseDTO employerDetails = redisTemplate.opsForValue().get(key);
                if (employerDetails != null) {
                    cachedEmployers.add(employerDetails);
                }
            }
            return cachedEmployers;
        }

        fallbackCache.entrySet().removeIf(entry -> entry.getValue().isExpired());
        for (CachedEmployerDetails cachedEmployerDetails : fallbackCache.values()) {
            EmployerAuthDetailsResponseDTO employerDetails = cachedEmployerDetails.employerDetails();
            if (employerDetails != null) {
                cachedEmployers.add(employerDetails);
            }
        }
        return cachedEmployers;
    }

    private boolean usesRedis() {
        return redisEnabled;
    }

    private String buildKey(String username) {
        return EMPLOYER_DETAILS_PREFIX + username;
    }

    private record CachedEmployerDetails(
            EmployerAuthDetailsResponseDTO employerDetails,
            Instant expiresAt
    ) {
        private boolean isExpired() {
            return Instant.now().isAfter(expiresAt);
        }
    }
}
