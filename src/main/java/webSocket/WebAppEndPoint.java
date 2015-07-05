package webSocket;

import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import javax.websocket.*;
import javax.websocket.server.ServerEndpoint;
import java.util.Iterator;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.logging.Logger;

/**
 * @author Yikai Gong
 */

@ServerEndpoint(value ="/webAppEndPoint")
public class WebAppEndPoint {
    public static JsonParser parser = new JsonParser();
    public static ConcurrentHashMap<String, WebAppEndPoint> endPointMap = new ConcurrentHashMap<>();

    //instance field
    private Logger logger = Logger.getLogger(this.getClass().getName());
    private Session session = null;

    @OnOpen
    public void onOpen(Session session) {
        try {
            this.session = session;
            String id = session.getId();
            endPointMap.put(id, this);
            logger.info("Connected ... " + id);
        }catch (Exception e){
            logger.info("onopen error");
        }
    }

    @OnMessage
    public void onMessage(String message, Session session) {

    }

    @OnClose
    public void onClose(Session session, CloseReason closeReason) {
        closeConnection();
    }

    @OnError
    public void onError(Throwable t){
        closeConnection();
        t.printStackTrace();
    }

    public void closeConnection(){
        endPointMap.remove(this.session.getId());
        System.out.println("Client close");
    }

    public static void broadcast(JsonObject tweet){
        Iterator it = endPointMap.entrySet().iterator();
        while(it.hasNext()){
            Map.Entry pairs = (Map.Entry)it.next();
            WebAppEndPoint endpoint = (WebAppEndPoint)pairs.getValue();
            endpoint.send(tweet);
        }
    }

    public void send(JsonObject json){
        try{
            this.session.getBasicRemote().sendText(json.toString());
        }catch (Exception e){
            e.printStackTrace();
        }
    }
}
