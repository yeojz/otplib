// Custom JUnit Reporter for Node.js Test Runner
// This reporter buffers events to produce a valid XML report with a single <testsuite> wrapping all test cases.
// It avoids dependencies and works with 'node --test' and 'tsx --test'.

import { createWriteStream } from "node:fs";
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
      // Filter out 'suite' type events if they are just grouping containers
      // However, sometimes suites are important. But usually for JUnit we just want the leaf tests.
      // Node.js test runner emits 'test' for both suites and tests, but details.type distinguishes them.
      if (event.data.details?.type === "test") {
        tests.push(event);
      }
    }
  }

  const duration = (Date.now() - startTime) / 1000;
  const totalTests = tests.length;
  const failures = tests.filter((t) => t.type === "test:fail").length;

  yield `<?xml version="1.0" encoding="utf-8"?>${EOL}`;
  yield `<testsuites>${EOL}`;
  yield `  <testsuite name="smoke-tests" tests="${totalTests}" failures="${failures}" skipped="0" time="${duration}">${EOL}`;

  for (const event of tests) {
    const { name, details } = event.data;
    const time = (details.duration_ms || 0) / 1000;
    const classname = "smoke-test"; // Generic classname

    if (event.type === "test:pass") {
      yield `    <testcase name="${escapeXML(
        name
      )}" time="${time}" classname="${classname}"/>${EOL}`;
    } else if (event.type === "test:fail") {
      const error = details.error || {};
      const message = escapeXML(error.message || "Test failed");
      const stack = escapeXML(error.stack || "");

      yield `    <testcase name="${escapeXML(
        name
      )}" time="${time}" classname="${classname}">${EOL}`;
      yield `      <failure message="${message}" type="${
        error.code || "Failure"
      }">${stack}</failure>${EOL}`;
      yield `    </testcase>${EOL}`;
    }
  }

  yield `  </testsuite>${EOL}`;
  yield `</testsuites>${EOL}`;
}
