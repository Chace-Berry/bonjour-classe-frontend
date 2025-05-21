import { useState, useEffect } from "react";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";

import Sidebar from "./Partials/Sidebar";
import Header from "./Partials/Header";
import { Link } from "react-router-dom";

import useAxios from "../../utils/useAxios";
import UserData from "../plugin/UserData";
import Swal from "sweetalert2";

function CourseCreate() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [course, setCourse] = useState({
    category: 0,
    file: "",
    image: "",
    title: "",
    description: "",
    price: "",
    level: "",
    language: "",
  });

  const [category, setCategory] = useState([]);
  const [progress, setProgress] = useState(0);
  const [ckEditorData, setCKEditorData] = useState("");

  const [variants, setVariants] = useState([
    {
      title: "",
      items: [{ title: "", description: "", file: "", preview: false }],
    },
  ]);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  useEffect(() => {
    useAxios()
      .get(`course/category/`)
      .then((res) => {
        setCategory(res.data);
      });
  }, []);

  console.log(category);

  const handleCourseInputChange = (event) => {
    setCourse({
      ...course,
      [event.target.name]:
        event.target.type === "checkbox"
          ? event.target.checked
          : event.target.value,
    });
  };

  const handleCkEditorChange = (event, editor) => {
    const data = editor.getData();
    setCKEditorData(data);
    console.log(ckEditorData);
  };

  const handleCourseImageChange = (event) => {
    const file = event.target.files[0];
    console.log(file);

    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCourse({
          ...course,
          image: {
            file: event.target.files[0],
            preview: reader.result,
          },
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCourseIntroVideoChange = (event) => {
    setCourse({
      ...course,
      [event.target.name]: event.target.files[0],
    });
  };

  const handleVariantChange = (index, propertyName, value) => {
    const updatedVariants = [...variants];
    updatedVariants[index][propertyName] = value;
    setVariants(updatedVariants);

    console.log(`Name: ${propertyName} - value: ${value} - Index: ${index}`);
    console.log(variants);
  };

  const handleItemChange = (
    variantIndex,
    itemIndex,
    propertyName,
    value,
    type
  ) => {
    const updatedVariants = [...variants];
    updatedVariants[variantIndex].items[itemIndex][propertyName] = value;
    setVariants(updatedVariants);

    console.log(
      `Name: ${propertyName} - value: ${value} - Index: ${variantIndex} ItemIndex: ${itemIndex} - type: ${type}`
    );
  };

  const addVariant = () => {
    setVariants([
      ...variants,
      {
        title: "",
        items: [{ title: "", description: "", file: "", preview: false }],
      },
    ]);
  };

  const removeVariant = (index) => {
    const updatedVariants = [...variants];
    updatedVariants.splice(index, 1);
    setVariants(updatedVariants);
  };

  const addItem = (variantIndex) => {
    const updatedVariants = [...variants];
    updatedVariants[variantIndex].items.push({
      title: "",
      description: "",
      file: "",
      preview: false,
    });

    setVariants(updatedVariants);
  };

  const removeItem = (variantIndex, itemIndex) => {
    const updatedVariants = [...variants];
    updatedVariants[variantIndex].items.splice(itemIndex, 1);
    setVariants(updatedVariants);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formdata = new FormData();
    formdata.append("title", course.title);
    formdata.append("image", course.image.file);
    formdata.append("description", ckEditorData);
    formdata.append("category", course.category);
    formdata.append("price", course.price);
    formdata.append("level", course.level);
    formdata.append("language", course.language);
    formdata.append("teacher", parseInt(UserData()?.teacher_id));
    console.log(course.category);
    if (course.file !== null || course.file !== "") {
      formdata.append("file", course.file || "");
    }

    variants.forEach((variant, variantIndex) => {
      Object.entries(variant).forEach(([key, value]) => {
        console.log(`Key: ${key} = value: ${value}`);
        formdata.append(
          `variants[${variantIndex}][variant_${key}]`,
          String(value)
        );
      });

      variant.items.forEach((item, itemIndex) => {
        Object.entries(item).forEach(([itemKey, itemValue]) => {
          formdata.append(
            `variants[${variantIndex}][items][${itemIndex}][${itemKey}]`,
            itemValue
          );
        });
      });
    });

    const response = await useAxios().post(`teacher/course-create/`, formdata);
    console.log(response.data);
    Swal.fire({
      icon: "success",
      title: "Course Created Successfully",
    });
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Sidebar */}
      <Sidebar sidebarCollapsed={sidebarCollapsed} />

      {/* Main Content */}
      <div
        style={{
          flex: 1,
          marginLeft: sidebarCollapsed ? "80px" : "270px",
          transition: "margin-left 0.3s ease",
        }}
      >
        {/* Header */}
        <Header
          sidebarCollapsed={sidebarCollapsed}
          toggleSidebar={toggleSidebar}
        />

        {/* Main Content */}
        <div style={{ padding: "20px" }}>
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="mb-4">Create a New Course</h5>
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">Course Title</label>
                  <input
                    type="text"
                    className="form-control"
                    name="title"
                    onChange={handleCourseInputChange}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Course Thumbnail</label>
                  <input
                    type="file"
                    className="form-control"
                    onChange={handleCourseImageChange}
                  />
                  {course.image.preview && (
                    <img
                      src={course.image.preview}
                      alt="Preview"
                      style={{
                        width: "100%",
                        height: "200px",
                        objectFit: "cover",
                        marginTop: "10px",
                      }}
                    />
                  )}
                </div>
                <div className="mb-3">
                  <label className="form-label">Course Description</label>
                  <CKEditor
                    editor={ClassicEditor}
                    data={ckEditorData}
                    onChange={handleCkEditorChange}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Category</label>
                  <select
                    className="form-select"
                    name="category"
                    onChange={handleCourseInputChange}
                  >
                    <option value="">Select Category</option>
                    {category.map((c, index) => (
                      <option key={index} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Price</label>
                  <input
                    type="number"
                    className="form-control"
                    name="price"
                    onChange={handleCourseInputChange}
                  />
                </div>
                <button type="submit" className="btn btn-primary w-100">
                  Create Course
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CourseCreate;
