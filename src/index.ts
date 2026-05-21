import * as core from "@actions/core";
import { main } from "./main";

main().catch((err) => core.setFailed(`❌ ${err.message}`));
