package yikaig;

import org.springframework.context.annotation.Bean;
import org.springframework.web.socket.server.standard.ServerEndpointExporter;
import yikaig.webSocket.StreamAppEndPoint;
import yikaig.webSocket.WebAppEndPoint;

/**
 * @author Yikai Gong
 */
public class EmbeddedTomcatConfig {
    /**
     *  Put those configures only used with embedded tomcat server
     */
    // If you want to use @ServerEndpoint in a Spring Boot application that used an embedded container,
    // you must declare a single ServerEndpointExporter
    // Note: This approach can work after spring-boot-starter 1.1.9!!
    @Bean
    public ServerEndpointExporter serverEndpointExporter() {
        return new ServerEndpointExporter();
    }

    // Make the @ServerEndpoint as bean but it will cause error when deploying to a stand-alone tomcat.
    @Bean
    public StreamAppEndPoint getStreamAppEndPoint(){
        return new StreamAppEndPoint();
    }

    @Bean
    public WebAppEndPoint getWebAppEndPoint(){
        return new WebAppEndPoint();
    }
}
