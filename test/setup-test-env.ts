import { installGlobals } from "@remix-run/node/globals";
import "@testing-library/jest-dom/extend-expect";
import { server } from "mocks/start";

process.env.SESSION_SECRET = "super-duper-s3cret";
process.env.SUPABASE_SERVICE_KEY = "{SERVICE_KEY}";
process.env.SUPABASE_URL = "https://supabase-project.supabase.co";

installGlobals();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterAll(() => server.close());
afterEach(() => server.resetHandlers());
