import { Template } from "@e2b-dev/template";
import { Sandbox } from "e2b";

export const template = Template()
    // .skipCache()
    .fromImage("node:21-slim")
    .runCmd("apt-get update && apt-get install -y curl && apt-get clean && rm -rf /var/lib/apt/lists/*")
    .copy("./compile_page.sh", "/compile_page.sh")    
    .runCmd("ls -la /")
    .runCmd("chmod +x /compile_page.sh")
    .setWorkdir("/home/user/nextjs-app")
    .runCmd([
        "npx create-next-app@14.2.20 . --ts --tailwind --no-eslint --import-alias \"@/*\" --use-npm --no-app --no-src-dir",
        "npx shadcn@2.1.7 init -d",
        "npx shadcn@2.1.7 add --all",
        "npm install posthog-js",
    ])
    .runCmd([
        "mv /home/user/nextjs-app/* /home/user/",
        "rm -rf /home/user/nextjs-app",
    ])
    .setReadyCmd("sleep 30s")
    .setStartCmd("/compile_page.sh")

async function main() {
    const sbx = await Sandbox.create("nextjs-developer-new-build-mlejva")
    const files = await sbx.files.list("/home/user/nextjs-app")
    console.log(files)
}

main().catch(console.error)