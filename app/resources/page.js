import styles from "./Resources.module.css";
import lecture_content_data from "../../data/lecture_content_data.json";
import BlogPostCard from "../../components/BlogPostCard.js";
import VideoCard from "../../components/VideoCard.js";

export default function ResourcesPage() {
  // state to keep track of the selected sem
  // list of sems from the data keys
  const blogPosts = lecture_content_data["Blog Posts"] || [];
  const staffPresentations =
    lecture_content_data["Staff Technical Presentations"] || [];

  return (
    <div className={`${styles.pageContainer} pageContainer`}>
      <main className={styles.mainContent}>
        <div className={styles.resourceSection}>
          <div className={styles.header}>
            <h1 className={styles.title}>Lecture Videos</h1>
          </div>

          <div className={styles.projectGrid}>
            {staffPresentations.map((project) => (
              <VideoCard key={project.id} project={project} />
            ))}
          </div>
        </div>

        <div className={styles.resourceSection}>
          <div className={styles.header}>
            <h1 className={styles.title}>Blog Posts</h1>
          </div>

          <div className={styles.projectGrid}>
            {blogPosts.map((project) => (
              <BlogPostCard key={project.id} project={project} />
            ))}
          </div>
        </div>

        <div className={styles.resourceVault}>
          <div className={styles.header}>
            <h1 className={styles.title}>Resource Vault</h1>
            <p className={styles.vaultDescription}>
              {" "}
              The CS124 Honors resource vault is a Notion page created to keep
              track of useful external resources that Project Managers and their
              students have accumulated in various subtopics over the semesters.
              This Notion page is publicly accessible{" "}
              <a
                href="https://typhoon-lifter-1e1.notion.site/CS124H-Resource-Vault-1adbec204dee8026a3ccd51e7e260f04"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#0070f3", textDecoration: "underline" }}
              >
                here.
              </a>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
