package org.example;

import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import org.apache.kafka.clients.producer.KafkaProducer;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.bson.Document;

import java.time.LocalDateTime;
import java.util.Properties;
import java.util.Random;

public class Producer {
    public static void main(String[] args) {

        Properties kafkaProps = new Properties();

        kafkaProps.put("bootstrap.servers", "localhost:9092");
        kafkaProps.put("key.serializer", "org.apache.kafka.common.serialization.StringSerializer");
        kafkaProps.put("value.serializer", "org.apache.kafka.common.serialization.StringSerializer");
        KafkaProducer<String, String> producer = new KafkaProducer<>(kafkaProps);

        var mongoClient = MongoClients.create("mongodb://localhost:27017");
        MongoDatabase db = mongoClient.getDatabase("logsdb");
        MongoCollection<Document> col = db.getCollection("webLogs");

        String[] levels = {"INFO", "WARN", "ERROR"};
        String[] services = {"auth", "payment", "frontend", "backend"};
        String[] httpMethods = {"GET", "POST"};
        String[] urls = {"/login", "/pay", "/home", "/dashboard"};
        Random random = new Random();

        int count = 1;
        while (true) {
            String level = levels[random.nextInt(levels.length)];
            String service = services[random.nextInt(services.length)];
            String httpMethod = httpMethods[random.nextInt(httpMethods.length)];
            String url = urls[random.nextInt(urls.length)];
            String clientIp = "192.168.1." + (random.nextInt(254) + 1);
            int httpStatus = (level.equals("ERROR")) ? 500 : (level.equals("WARN")) ? 404 : 200;
            long latencyMs = 50 + random.nextInt(450);

            String msg = String.format("Requête %s effectuée sur le service %s", httpMethod, url);

            String logJson = String.format("""
                    {
                      "timestamp": "%s",
                      "level": "%s",
                      "method": "%s",
                      "url": "%s",
                      "status": %d,
                      "latencyMs": %d,
                      "clientIp": "%s",
                      "message": "%s",
                      "service": "%s"
                    }
                    """, LocalDateTime.now(), level, httpMethod, url, httpStatus, latencyMs, clientIp, msg, service);

            producer.send(new ProducerRecord<>("web_logs", null, logJson));

            Document doc = Document.parse(logJson);
            col.insertOne(doc);

            System.out.println("Log " + count + " envoyé : " + logJson);

            count++;

            try {
                Thread.sleep(100);
            } catch (InterruptedException e) {
                e.printStackTrace();
                break;
            }
        }

        producer.close();
        mongoClient.close();
        System.out.println("Arrêt de la génération des logs.");
    }
}




