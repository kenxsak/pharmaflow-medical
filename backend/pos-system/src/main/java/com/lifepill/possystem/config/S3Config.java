package com.lifepill.possystem.config;

import com.amazonaws.auth.AWSStaticCredentialsProvider;
import com.amazonaws.auth.BasicAWSCredentials;
import com.amazonaws.regions.Regions;
import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.AmazonS3ClientBuilder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class S3Config {

    @Value("${aws.access.key:}")
    private String awsAccessKey;

    @Value("${aws.secret.key:}")
    private String awsSecretKey;

    @Value("${aws.region:ap-south-1}")
    private String awsRegion;

    @Bean
    public AmazonS3 s3client() {
        if (awsAccessKey == null || awsAccessKey.trim().isEmpty() ||
            awsSecretKey == null || awsSecretKey.trim().isEmpty()) {
            return null;
        }

        try {
            BasicAWSCredentials awsCredentials = new BasicAWSCredentials(awsAccessKey.trim(), awsSecretKey.trim());
            String region = (awsRegion != null && !awsRegion.trim().isEmpty()) ? awsRegion.trim() : "ap-south-1";

            return AmazonS3ClientBuilder.standard()
                    .withCredentials(new AWSStaticCredentialsProvider(awsCredentials))
                    .withRegion(Regions.fromName(region))
                    .build();
        } catch (Exception e) {
            return null;
        }
    }
}
