package org.example;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin(origins = "*")
public class StatsController {

    @GetMapping("/stats")
    public Map<String, Object> getStats() {

        return KafkaLogAnalyserService.latestStatsSnapshot;
    }

    @GetMapping("/statsHistory")
    public List<Map<String, Object>> getStatsHistory() {
        synchronized (KafkaLogAnalyserService.statsHistory) {
            return new ArrayList<>(KafkaLogAnalyserService.statsHistory);
        }
    }
    @GetMapping("/statsCumulative")
    public Map<String, Object> getCumulativeStats() {
        Map<String, Object> stats = new LinkedHashMap<>();
        long total = KafkaLogAnalyserService.totalLogsCumulative.get();
        long count2xx = KafkaLogAnalyserService.success2xxCumulative.get();
        long count4xx = KafkaLogAnalyserService.error4xxCumulative.get();
        long count5xx = KafkaLogAnalyserService.error5xxCumulative.get();
        stats.put("totalProcessedLogs", total);
        stats.put("success2xx", count2xx);
        stats.put("errors4xx", count4xx);
        stats.put("errors5xx", count5xx);
        double errorRate = total > 0 ? (count5xx * 100.0) / total : 0;
        stats.put("errorRatePercent", String.format("%.2f", errorRate));
        Map<String, Object> urlStats = new LinkedHashMap<>();
        KafkaLogAnalyserService.urlCountMapCumulative.forEach((url, count) -> {
            double percentage = total > 0 ? (count.get() * 100.0) / total : 0;
            Map<String, Object> details = new LinkedHashMap<>();
            details.put("count", count.get());
            details.put("percentage", String.format("%.1f", percentage));
            urlStats.put(url, details);
        });
        Map<String, Object> urls4xx = new LinkedHashMap<>();
        KafkaLogAnalyserService.error4xxUrlsCumulative.forEach((url, count) -> {
            urls4xx.put(url, count.get());
        });
        stats.put("urls4xx", urls4xx);
        Map<String, Object> urls5xx = new LinkedHashMap<>();
        KafkaLogAnalyserService.error5xxUrlsCumulative.forEach((url, count) -> {
            urls5xx.put(url, count.get());
        });
        stats.put("urls5xx", urls5xx);
        stats.put("urlStats", urlStats);
        return stats;
    }

    @GetMapping("/health")
    public Map<String, Object> getHealth() {
        return Map.of(
                "status", "UP",
                "kafkaService", "RUNNING",
                "totalLogs", KafkaLogAnalyserService.totalProcessedLogs.get()
        );
    }

}
