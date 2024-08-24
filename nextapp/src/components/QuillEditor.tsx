import { NextPage } from "next";
import dynamic from "next/dynamic";
import { Dispatch, SetStateAction, useEffect, useMemo, useRef } from "react";
import "react-quill/dist/quill.snow.css";
import axios from "axios";
interface Element {
  style: CSSStyleDeclaration;
}

const ReactQuill = dynamic(
  async () => {
    const { default: RQ } = await import("react-quill");
    return function comp({ forwardedRef, ...props }: any) {
      return <RQ ref={forwardedRef} {...props} />;
    };
  },
  { ssr: false }
);

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
  const quillRef = useRef<any>(null);
  useEffect(() => {
    setTimeout(() => {
      const elems = document.querySelectorAll<HTMLElement>(".ql-snow");
      elems.forEach((el) => {
        el.style.border = "none";
      });
      elems[1].style.fontSize = "20px";
    }, 500);
  }, []);
  const uploadToPinata = async (imageFile: File) => {
    const formData = new FormData();
    formData.append("file", imageFile);

    const metadata = JSON.stringify({
      name: imageFile.name,
    });

    formData.append("pinataMetadata", metadata);

    const options = JSON.stringify({
      cidVersion: 0,
    });

    formData.append("pinataOptions", options);

    try {
      const response = await axios.post(
        "https://api.pinata.cloud/pinning/pinFileToIPFS",
        formData,
        {
          headers: {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_PINATA_JWT}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      // IPFS CID를 이용해 IPFS 게이트웨이 URL 생성
      const ipfsHash = response.data.IpfsHash;
      const imageURL = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
      return imageURL;
    } catch (error) {
      console.error("Error uploading file to Pinata:", error);
      return null;
    }
  };

  const handleImageUpload = async () => {
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", "image/*");
    input.click();

    input.onchange = async () => {
      const file = input.files ? input.files[0] : null;
      if (file) {
        const imageURL = await uploadToPinata(file);
        if (imageURL) {
          const editor = quillRef.current.getEditor();
          const range = editor.getSelection();
          editor.insertEmbed(range.index, "image", imageURL);
        }
      }
    };
  };
  const modules = useMemo(
    () => ({
      toolbar: {
        container: [
          ["bold", "italic", "underline", "strike"],
          ["customControl"],
          ["blockquote", "code-block"],

          [{ header: 1 }, { header: 2 }],
          [{ list: "ordered" }, { list: "bullet" }],
          [{ script: "sub" }, { script: "super" }],
          [{ indent: "-1" }, { indent: "+1" }],
          [{ direction: "rtl" }],

          [{ size: ["small", false, "large", "huge"] }],
          [{ header: [1, 2, 3, 4, 5, 6, false] }],

          [{ color: [] }, { background: [] }],
          [{ font: [] }],
          [{ align: [] }],

          ["clean"],
          ["image", "video"],
        ],
        handlers: {
          image: handleImageUpload,
          customControl: () => {
            console.log("customControl was clicked");
          },
        },
      },
    }),
    []
  );
  const checkCharacterCount = (event: any) => {
    const unprivilegedEditor = quillRef.current.unprivilegedEditor;
    console.log("length::", unprivilegedEditor.getLength());
    setLength(unprivilegedEditor.getLength());
  };

  return (
    <ReactQuill
      onKeyDown={checkCharacterCount}
      forwardedRef={quillRef}
      placeholder="Tell us your story"
      value={content}
      onChange={(value: string) => {
        setContent(value);
        setLength(value.length);
      }}
      modules={modules}
      formats={formats}
      // style={{ fontSize: 6 }}
    />
  );
};

export default QuillEditor;
