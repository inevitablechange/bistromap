import { NextPage } from "next";
import dynamic from "next/dynamic";
import "react-quill/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

const QuillEditor: NextPage = () => {
  return (
    <ReactQuill
      modules={{
        toolbar: [
          [{ header: [1, 2, false] }],
          ["bold", "italic", "underline", "strike", "blockquote"],
          [
            { list: "ordered" },
            { list: "bullet" },
            { indent: "-1" },
            { indent: "+1" },
            { align: [] },
          ],
          ["link", "image"],
          ["clean"],
        ],
      }}
      style={{ width: "100%", height: "85%", marginBottom: "6%" }}
    />
  );
};

export default QuillEditor;
