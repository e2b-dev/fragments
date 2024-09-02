import ReactPrismjs from "@uiw/react-prismjs";
import "prismjs/components/prism-python";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-tsx";
import "prismjs/themes/prism.css";
// import "prismjs/plugins/line-numbers/prism-line-numbers.js";
// import "prismjs/plugins/line-numbers/prism-line-numbers.css";

export function CodeView({ code, lang }: { code: string; lang: string }) {
  return (
    <ReactPrismjs
      source={code}
      language={lang}
      // className="line-numbers"
      // @ts-ignore
      style={{
        fontFamily: '"Fira code", "Fira Mono", monospace',
        fontSize: 14,
        backgroundColor: "transparent",
        margin: 0,
        padding: 0,
      }}
    />
  );
}
