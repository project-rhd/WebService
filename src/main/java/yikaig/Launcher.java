package yikaig;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.context.web.SpringBootServletInitializer;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;

/**
 * @author Yikai Gong
 */

@EnableAutoConfiguration
@ComponentScan
@Configuration
public class Launcher extends SpringBootServletInitializer {
    public static void main(String[] args) {
        Object[] entries = new Object[2];
        entries[0] = Launcher.class;
        entries[1] = EmbeddedTomcatConfig.class;
        SpringApplication app = new SpringApplication(entries);
        app.setShowBanner(false);
        ApplicationContext context = app.run(args);
    }

    @Override
    protected SpringApplicationBuilder configure(SpringApplicationBuilder application) {
        return application.sources(Launcher.class);
    }
}
