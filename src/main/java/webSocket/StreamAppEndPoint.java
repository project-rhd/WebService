package webSocket;

import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import javax.websocket.*;
import javax.websocket.server.ServerEndpoint;
import java.util.concurrent.ConcurrentHashMap;
import java.util.logging.Logger;

/**
 * @author Yikai Gong
 */

@ServerEndpoint(value ="/streamAppEndPoint")
public class StreamAppEndPoint {

    public static JsonParser parser = new JsonParser();

    //instance field
    private Logger logger = Logger.getLogger(this.getClass().getName());
    private Session session = null;

    @OnOpen
    public void onOpen(Session session) {
        try {
            this.session = session;
            String id = session.getId();
            logger.info("Connected ... " + id);
        }catch (Exception e){
            logger.info("onopen error");
        }
    }

    @OnMessage
    public void onMessage(String message, Session session) {
        JsonObject tweet = (JsonObject)parser.parse(message);
        WebAppEndPoint.broadcast(tweet);
    }

    @OnClose
    public void onClose(Session session, CloseReason closeReason) {
        System.out.println("Real time harvester close");
    }

    @OnError
    public void onError(Throwable t){
        System.out.println("Real time harvester connection error");
        t.printStackTrace();
    }
}
