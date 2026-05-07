export const config = {
  schedule: "*/10 * * * *",
};

const BACKEND_LIVENESS_URL =
  "https://pharmaflow-backend-fou9.onrender.com/actuator/health/liveness";

export default async function keepDemoBackendWarm() {
  const startedAt = Date.now();
  const response = await fetch(BACKEND_LIVENESS_URL, {
    headers: {
      "user-agent": "pharmaflow-demo-keepalive/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Backend keepalive failed with ${response.status} ${response.statusText}`,
    );
  }

  console.log(
    `Backend keepalive ok in ${Date.now() - startedAt}ms: ${BACKEND_LIVENESS_URL}`,
  );

  return new Response(null, { status: 204 });
}
