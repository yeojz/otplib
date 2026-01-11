// Custom JUnit Reporter for Node.js Test Runner
// This reporter buffers events to produce a valid JUnit XML report.
// Fully compliant with the JUnit XML schema expected by CI tools.

import { EOL } from "node:os";

function escapeXML(str) {
  if (typeof str !== "string") return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export default async function* customReporter(source) {
  const tests = [];
  let startTime = Date.now();

  // Buffer all events
  for await (const event of source) {
    if (event.type === "test:pass" || event.type === "test:fail") {
      // Filter out 'suite' type events - we only want actual test cases
      if (event.data.details?.type === "test") {
        tests.push(event);
      }
    }
  }

  const duration = (Date.now() - startTime) / 1000;
  const totalTests = tests.length;
  const failures = tests.filter((t) => t.type === "test:fail").length;

  // JUnit XML with all required attributes
  yield `<?xml version="1.0" encoding="UTF-8"?>${EOL}`;
  yield `<testsuites name="smoke-tests" tests="${totalTests}" failures="${failures}" errors="0" time="${duration.toFixed(
    3
  )}">${EOL}`;
  yield `  <testsuite name="smoke-tests" tests="${totalTests}" failures="${failures}" errors="0" skipped="0" time="${duration.toFixed(
    3
  )}">${EOL}`;

  for (const event of tests) {
    const { name, details, file } = event.data;
    const time = ((details.duration_ms || 0) / 1000).toFixed(6);
    // Use file path as classname if available, otherwise use generic
    const classname = file
      ? file
          .split("/")
          .pop()
          .replace(/\.[^/.]+$/, "")
      : "smoke-test";

    if (event.type === "test:pass") {
      yield `    <testcase name="${escapeXML(name)}" classname="${escapeXML(
        classname
      )}" time="${time}"/>${EOL}`;
    } else if (event.type === "test:fail") {
      const error = details.error || {};
      const message = escapeXML(error.message || "Test failed");
      const stack = escapeXML(error.stack || "");
      const type = escapeXML(error.code || "AssertionError");

      yield `    <testcase name="${escapeXML(name)}" classname="${escapeXML(
        classname
      )}" time="${time}">${EOL}`;
      yield `      <failure message="${message}" type="${type}"><![CDATA[${
        error.stack || ""
      }]]></failure>${EOL}`;
      yield `    </testcase>${EOL}`;
    }
  }

  yield `  </testsuite>${EOL}`;
  yield `</testsuites>${EOL}`;
}
