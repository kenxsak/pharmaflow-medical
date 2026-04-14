package com.lifepill.api_gateway.controller;

import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import reactor.core.publisher.Mono;

/**
 * Controller for serving static pages like password reset.
 */
@Controller
public class StaticPageController {
    
    @GetMapping(value = "/reset-password", produces = MediaType.TEXT_HTML_VALUE)
    @ResponseBody
    public Mono<Resource> resetPasswordPage() {
        return Mono.just(new ClassPathResource("static/reset-password.html"));
    }
}
