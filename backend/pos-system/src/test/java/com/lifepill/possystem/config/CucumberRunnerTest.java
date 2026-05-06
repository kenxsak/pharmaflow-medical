package com.lifepill.possystem.config;

import io.cucumber.junit.Cucumber;
import io.cucumber.junit.CucumberOptions;
import org.junit.Ignore;
import org.junit.runner.RunWith;

@Ignore("Cucumber feature files and step definitions are currently commented out; keep unit tests as the active backend test gate.")
@RunWith(Cucumber.class)
@CucumberOptions(
        features = "src/test/resources/features",
        glue = "com.example.cucumber.stepdefinitions"
)
public class CucumberRunnerTest {
}
