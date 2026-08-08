#!/usr/bin/env node

const http = require("http");
const url = require("url");

// Configuration
const PORT = 3003;
const HOST = "localhost";

// Helper function to generate random busy events
function generateRandomBusyEvents(startDate, endDate) {
  const events = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Generate 2-5 random events
  const eventCount = Math.floor(Math.random() * 4) + 2;

  for (let i = 0; i < eventCount; i++) {
    // Generate random start time within the range
    const eventStart = new Date(
      start.getTime() + Math.random() * (end.getTime() - start.getTime()),
    );

    // Generate random duration (30 minutes to 3 hours)
    const durationMinutes = Math.floor(Math.random() * 150) + 30;
    const eventEnd = new Date(eventStart.getTime() + durationMinutes * 60000);

    // Make sure event doesn't exceed the end date
    if (eventEnd > end) {
      eventEnd.setTime(end.getTime());
    }

    // Generate random event titles
    const titles = [
      "Team Meeting",
      "Client Call",
      "Project Review",
      "Standup Meeting",
      "Code Review",
      "Planning Session",
      "Demo Presentation",
      "Training Session",
      "One-on-One",
      "Workshop",
      "Conference Call",
      "Interview",
      "Lunch Meeting",
      "Board Meeting",
      "Sprint Planning",
    ];

    const title = titles[Math.floor(Math.random() * titles.length)];
    const uid = `event-${Date.now()}-${i}`;

    events.push({
      startAt: eventStart.toISOString(),
      endAt: eventEnd.toISOString(),
      title: title,
      uid: uid,
    });
  }

  // Sort events by start time
  return events.sort((a, b) => new Date(a.startAt) - new Date(b.startAt));
}

// Helper function to generate random schedule data
function generateRandomSchedule(startDate, endDate) {
  const schedule = {};
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Generate schedule for each day in the range
  const currentDate = new Date(start);
  while (currentDate <= end) {
    const dateStr = currentDate.toISOString().split("T")[0]; // YYYY-MM-DD format

    // Skip weekends (Saturday = 6, Sunday = 0)
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      // Generate 1-3 shifts per day
      const shiftCount = Math.floor(Math.random() * 3) + 1;
      const shifts = [];

      // Generate non-overlapping shifts
      let lastEndTime = 8 * 60; // Start from 8:00 AM (in minutes)
      const maxEndTime = 18 * 60; // End at 6:00 PM (in minutes)
      const minShiftDuration = 3 * 60; // 3 hours minimum

      for (let i = 0; i < shiftCount; i++) {
        // Ensure we have enough time for at least a 3-hour shift
        if (lastEndTime >= maxEndTime - minShiftDuration) {
          break;
        }

        // Generate random start time (after last shift ends, with some gap)
        const minGap = 30; // 30 minutes gap between shifts
        const maxGap = 120; // 2 hours max gap
        const gap = Math.floor(Math.random() * (maxGap - minGap + 1)) + minGap;
        let startTimeMinutes = lastEndTime + gap;

        // Round start time to nearest 10-minute interval
        startTimeMinutes = Math.round(startTimeMinutes / 10) * 10;

        // Don't start too late in the day
        if (startTimeMinutes >= maxEndTime - minShiftDuration) {
          break;
        }

        // Generate random duration (3-5 hours)
        const minDuration = minShiftDuration; // 3 hours minimum
        const maxDuration = 8 * 60; // 5 hours maximum
        const duration =
          Math.floor(Math.random() * (maxDuration - minDuration + 1)) +
          minDuration;

        // Round duration to nearest 10-minute interval
        const roundedDuration = Math.round(duration / 10) * 10;

        // Ensure shift doesn't exceed end of day
        const endTimeMinutes = Math.min(
          startTimeMinutes + roundedDuration,
          maxEndTime,
        );

        // Round end time to nearest 10-minute interval
        const roundedEndTime = Math.round(endTimeMinutes / 10) * 10;

        // Convert to HH:mm format
        const startHour = Math.floor(startTimeMinutes / 60);
        const startMinute = startTimeMinutes % 60;
        const endHour = Math.floor(roundedEndTime / 60);
        const endMinute = roundedEndTime % 60;

        const startTime = `${startHour.toString().padStart(2, "0")}:${startMinute.toString().padStart(2, "0")}`;
        const endTime = `${endHour.toString().padStart(2, "0")}:${endMinute.toString().padStart(2, "0")}`;

        shifts.push({
          start: startTime,
          end: endTime,
        });

        // Update last end time for next shift
        lastEndTime = roundedEndTime;
      }

      schedule[dateStr] = shifts;
    } else {
      // Weekend - no shifts
      schedule[dateStr] = [];
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return schedule;
}

// Create HTTP server
const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  // Parse URL and query parameters
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const query = parsedUrl.query;

  console.log(`${new Date().toISOString()} - ${req.method} ${pathname}`);
  console.log("Query params:", query);

  // Handle different endpoints
  if (pathname === "/api/busy-events" || pathname === "/busy-events") {
    // Check for required query parameters
    const start = query.start;
    const end = query.end;

    if (!start || !end) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          error:
            "Missing required parameters: start and end dates are required",
          example: `${req.url}?start=2024-01-15T00:00:00.000Z&end=2024-01-15T23:59:59.000Z`,
        }),
      );
      return;
    }

    try {
      // Generate random busy events
      const busyEvents = generateRandomBusyEvents(start, end);

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(busyEvents));

      console.log(`Generated ${busyEvents.length} busy events`);
      busyEvents.forEach((event) => {
        console.log(`  - ${event.title}: ${event.startAt} to ${event.endAt}`);
      });
    } catch (error) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          error: "Invalid date format",
          message: error.message,
        }),
      );
    }
  } else if (pathname === "/api/schedule" || pathname === "/schedule") {
    // Check for required query parameters
    const start = query.start;
    const end = query.end;

    if (!start || !end) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          error:
            "Missing required parameters: start and end dates are required",
          example: `${req.url}?start=2024-01-15T00:00:00.000Z&end=2024-01-15T23:59:59.000Z`,
        }),
      );
      return;
    }

    try {
      // Generate random schedule
      const schedule = generateRandomSchedule(start, end);

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(schedule));

      console.log(
        `Generated schedule for ${Object.keys(schedule).length} days`,
      );
      Object.entries(schedule).forEach(([date, shifts]) => {
        console.log(`  - ${date}: ${shifts.length} shifts`);
        shifts.forEach((shift) => {
          console.log(`    * ${shift.start} - ${shift.end}`);
        });
      });
    } catch (error) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          error: "Invalid date format",
          message: error.message,
        }),
      );
    }
  } else if (pathname === "/health" || pathname === "/") {
    // Health check endpoint
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        status: "healthy",
        service: "URL Apps Test Server",
        timestamp: new Date().toISOString(),
        endpoints: {
          "GET /api/busy-events":
            "Get busy events (requires start and end query params)",
          "GET /api/schedule":
            "Get schedule (requires start and end query params)",
          "GET /health": "Health check",
        },
        examples: {
          busyEvents: `http://${HOST}:${PORT}/api/busy-events?start=2024-01-15T00:00:00.000Z&end=2024-01-15T23:59:59.000Z`,
          schedule: `http://${HOST}:${PORT}/api/schedule?start=2024-01-15T00:00:00.000Z&end=2024-01-15T23:59:59.000Z`,
          scheduleWithPlaceholders:
            "Configure URL schedule provider as http://HOST:PORT/api/schedule?start={{start}}&end={{end}}&memberId={{memberId}}",
        },
        responseFormats: {
          busyEvents: [
            {
              startAt: "2024-01-15T09:30:00.000Z",
              endAt: "2024-01-15T10:30:00.000Z",
              title: "Team Meeting",
              uid: "event-1705123456789-0",
            },
          ],
          schedule: {
            "2024-01-15": [
              {
                start: "09:00",
                end: "17:00",
              },
              {
                start: "18:00",
                end: "22:00",
              },
            ],
          },
        },
      }),
    );
  } else {
    // 404 for unknown endpoints
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        error: "Not Found",
        availableEndpoints: ["/api/busy-events", "/api/schedule", "/health"],
      }),
    );
  }
});

// Start the server
server.listen(PORT, HOST, () => {
  console.log("🚀 URL Apps Test Server Started");
  console.log(`📍 Server running at http://${HOST}:${PORT}`);
  console.log("");
  console.log("📋 Available endpoints:");
  console.log(
    `   GET  http://${HOST}:${PORT}/api/busy-events?start=START_DATE&end=END_DATE`,
  );
  console.log(
    `   GET  http://${HOST}:${PORT}/api/schedule?start=START_DATE&end=END_DATE`,
  );
  console.log(`   GET  http://${HOST}:${PORT}/health`);
  console.log("");
  console.log("💡 Example usage:");
  console.log(
    `   curl "http://${HOST}:${PORT}/api/busy-events?start=2024-01-15T00:00:00.000Z&end=2024-01-15T23:59:59.000Z"`,
  );
  console.log(
    `   curl "http://${HOST}:${PORT}/api/schedule?start=2024-01-15T00:00:00.000Z&end=2024-01-15T23:59:59.000Z"`,
  );
  console.log("");
  console.log("🔄 Server will generate random data for any date range:");
  console.log("📅 Busy Events: 2-5 random events with realistic titles");
  console.log(
    "📅 Schedule: Weekdays 1-3 shifts (8:00-18:00), Weekends no shifts",
  );
  console.log("⏹️  Press Ctrl+C to stop the server");
  console.log("");
});

// Handle server errors
server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `❌ Port ${PORT} is already in use. Please try a different port.`,
    );
  } else {
    console.error("❌ Server error:", err);
  }
  process.exit(1);
});

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down server...");
  server.close(() => {
    console.log("✅ Server stopped");
    process.exit(0);
  });
});

process.on("SIGTERM", () => {
  console.log("\n🛑 Shutting down server...");
  server.close(() => {
    console.log("✅ Server stopped");
    process.exit(0);
  });
});
