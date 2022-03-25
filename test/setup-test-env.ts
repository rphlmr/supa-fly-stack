import { installGlobals } from "@remix-run/node/globals";
import "@testing-library/jest-dom/extend-expect";
import { server } from "mocks/start";

process.env.SESSION_SECRET = "super-duper-s3cret";
process.env.SUPABASE_SERVICE_ROLE = "{SERVICE_ROLE}";
process.env.SUPABASE_ANON_PUBLIC = "{ANON_PUBLIC}";
process.env.SUPABASE_URL = "https://supabase-project.supabase.co";
process.env.SERVER_URL = "http://localhost:3000";

installGlobals();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterAll(() => server.close());
afterEach(() => server.resetHandlers());
