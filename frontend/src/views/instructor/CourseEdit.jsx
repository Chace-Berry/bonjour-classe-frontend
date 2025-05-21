import { useState, useEffect } from "react";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import Sidebar from "./Partials/Sidebar";
import Header from "./Partials/Header";
import useAxios from "../../utils/useAxios";
import UserData from "../plugin/UserData";
import Swal from "sweetalert2";
import { useParams } from "react-router-dom";

function CourseEdit() {
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
    teacher_course_status: "",
  });
  const [category, setCategory] = useState([]);
  const [ckEditorData, setCKEditorData] = useState("");
  const [variants, setVariants] = useState([]);
  const param = useParams();

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const fetchCourseDetail = () => {
    useAxios()
      .get(`course/category/`)
      .then((res) => {
        setCategory(res.data);
      });

    useAxios()
      .get(`teacher/course-detail/${param.course_id}/`)
      .then((res) => {
        setCourse(res.data);
        setVariants(res.data.curriculum);
        setCKEditorData(res.data.description);
      });
  };

  useEffect(() => {
    fetchCourseDetail();
  }, []);

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
  };

  const handleCourseImageChange = (event) => {
    const file = event.target.files[0];
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formdata = new FormData();
    formdata.append("title", course.title);
    formdata.append("description", ckEditorData);
    formdata.append("category", course.category);
    formdata.append("price", course.price);
    formdata.append("level", course.level);
    formdata.append("language", course.language);
    formdata.append("teacher", parseInt(UserData()?.teacher_id));

    if (course.file) {
      formdata.append("file", course.file);
    }

    if (course.image.file) {
      formdata.append("image", course.image.file);
    }

    const response = await useAxios().patch(
      `teacher/course-update/${UserData()?.teacher_id}/${param.course_id}/`,
      formdata
    );
    Swal.fire({
      icon: "success",
      title: "Course Updated Successfully",
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
              <h5 className="mb-4">Edit Course</h5>
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">Course Title</label>
                  <input
                    type="text"
                    className="form-control"
                    name="title"
                    value={course.title}
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
                    value={course.category.id}
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
                    value={course.price}
                    onChange={handleCourseInputChange}
                  />
                </div>
                <button type="submit" className="btn btn-primary w-100">
                  Update Course
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CourseEdit;
