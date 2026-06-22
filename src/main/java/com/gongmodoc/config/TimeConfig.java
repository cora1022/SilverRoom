package com.gongmodoc.config;

import jakarta.annotation.PostConstruct;
import java.util.TimeZone;
import org.springframework.context.annotation.Configuration;

@Configuration
public class TimeConfig {
    public static final String SEOUL_ZONE_ID = "Asia/Seoul";

    @PostConstruct
    public void setDefaultTimezone() {
        TimeZone.setDefault(TimeZone.getTimeZone(SEOUL_ZONE_ID));
    }
}
