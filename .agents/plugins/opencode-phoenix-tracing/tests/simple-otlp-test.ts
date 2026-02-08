import { register, trace } from "@arizeai/phoenix-otel";

const PHOENIX_URL = "http://localhost:19060";
const PROJECT = "otel-test";

async function test() {
  console.log("Registering with Phoenix...");
  
  const provider = register({
    projectName: PROJECT,
    url: PHOENIX_URL,
    batch: true,
  });
  
  console.log("Provider registered:", provider ? "yes" : "no");
  
  const tracer = trace.getTracer("test");
  
  console.log("Creating test span...");
  const span = tracer.startSpan("test-span", {
    attributes: {
      "test.value": "hello",
    },
  });
  
  // Simulate work
  await new Promise(r => setTimeout(r, 100));
  
  span.end();
  console.log("Span ended");
  
  console.log("Flushing...");
  try {
    await provider.forceFlush();
    console.log("Flush complete!");
  } catch (err) {
    console.error("Flush error:", err);
  }
  
  console.log("Shutting down...");
  await provider.shutdown();
  console.log("Done");
}

test().catch(console.error);
