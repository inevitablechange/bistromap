import { NextPage } from "next";
import dynamic from "next/dynamic";
import { Dispatch, SetStateAction } from "react";
import "react-quill/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });
const modules = {
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
};

const formats = [
  "header",
  "bold",
  "italic",
  "underline",
  "strike",
  "blockquote",
  "list",
  "bullet",
  "link",
  "indent",
  "image",
  "code-block",
  "color",
];

interface QuillEditorInterface {
  content: string;
  setContent: Dispatch<SetStateAction<string>>;
  setLength: Dispatch<SetStateAction<number>>;
}

const QuillEditor: NextPage<QuillEditorInterface> = ({
  content,
  setContent,
  setLength,
}) => {
  return (
    <ReactQuill
      placeholder="Tell us your story"
      value={content}
      onChange={(e) => {
        setContent(e);
        setLength(e.length);
      }}
      modules={modules}
      formats={formats}
      style={{ width: "100%", height: "85%" }}
    />
  );
};

export default QuillEditor;
