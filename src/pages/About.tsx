import React from 'react';
import { useLanguage } from '../i18n/LanguageContext';

export const About: React.FC = () => {
  const { language, t } = useLanguage();

  const details = {
    zh: {
      intro: "你好！我是一名计算机专业的在读学生，热衷于全栈 Web 开发、人机交互与算法研究。我喜欢用代码去构建能够真正帮到别人的工具，并不断通过博客记录自己的技术成长路径。",
      educationList: [
        {
          school: "某著名科技大学",
          degree: "计算机科学与技术 - 学士学位",
          period: "2023 - 至今",
          details: "专业前 5%，多次获得国家奖学金。主修课程包括数据结构、算法分析、计算机网络、操作系统及软件工程。"
        }
      ],
      skillsList: [
        { category: "前端开发", items: ["React", "TypeScript", "HTML5/CSS3", "Vite", "TailwindCSS"] },
        { category: "后端与数据库", items: ["Node.js", "Express", "Python", "MongoDB", "MySQL"] },
        { category: "工具与平台", items: ["Git / GitHub", "Docker", "Linux", "Vercel / Netlify"] }
      ],
      expList: [
        {
          title: "校园技术社团 - 前端负责人",
          period: "2024 - 至今",
          desc: "负责校园技术论坛的前端维护，重构核心页面并引入 TypeScript，将页面首屏加载时间降低了 40%。指导了 10+ 成员入门 React 开发。"
        },
        {
          title: "某互联网公司 - 前端开发实习生",
          period: "2025.03 - 2025.06",
          desc: "参与核心业务管理后台的设计与组件化封装工作。开发了可视化数据报表模块，支撑了团队日常的数据统计流转。"
        }
      ]
    },
    en: {
      intro: "Hello! I am a computer science student passionate about full-stack web development, human-computer interaction, and algorithms. I love building practical tools with code and recording my progress via blog notes.",
      educationList: [
        {
          school: "University of Science and Technology",
          degree: "B.S. in Computer Science and Technology",
          period: "2023 - Present",
          details: "Top 5% in GPA. National Scholarship recipient. Key courses: Data Structures, Algorithms, Computer Networks, Operating Systems, Software Engineering."
        }
      ],
      skillsList: [
        { category: "Frontend", items: ["React", "TypeScript", "HTML5/CSS3", "Vite", "TailwindCSS"] },
        { category: "Backend & DB", items: ["Node.js", "Express", "Python", "MongoDB", "MySQL"] },
        { category: "Tools & Platforms", items: ["Git / GitHub", "Docker", "Linux", "Vercel / Netlify"] }
      ],
      expList: [
        {
          title: "Campus Tech Club - Frontend Lead",
          period: "2024 - Present",
          desc: "Responsible for campus forum frontend maintenance. Refactored key pages using TypeScript, decreasing page load time by 40%. Guided 10+ junior members in React."
        },
        {
          title: "Tech Corp - Frontend Developer Intern",
          period: "Mar 2025 - Jun 2025",
          desc: "Contributed to component encapsulation of internal management dashboards. Developed interactive reports and visualization tools for daily operations."
        }
      ]
    }
  };

  const currentData = details[language];

  return (
    <div className="about-page page-container animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">{t('navAbout')}</h1>
      </div>

      <div className="about-layout-grid">
        <section className="about-intro-section border-box-style">
          <p className="lead-intro">{currentData.intro}</p>
          <div className="resume-download-wrapper">
            {/* The resume will download a dummy file for now, or link to a real path */}
            <a 
              href={`/${t('resumeFileName')}`} 
              download 
              className="btn btn-primary"
            >
              📄 {t('downloadResume')}
            </a>
          </div>
        </section>

        <section className="about-education-section">
          <h2>🎓 {t('education')}</h2>
          <div className="education-timeline">
            {currentData.educationList.map((edu, idx) => (
              <div key={idx} className="timeline-item border-box-style">
                <span className="timeline-period">{edu.period}</span>
                <h3 className="timeline-school">{edu.school}</h3>
                <h4 className="timeline-degree">{edu.degree}</h4>
                <p className="timeline-details">{edu.details}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="about-skills-section">
          <h2>⚡ {t('skills')}</h2>
          <div className="skills-grid">
            {currentData.skillsList.map((skillGroup, idx) => (
              <div key={idx} className="skill-group-box border-box-style">
                <h3>{skillGroup.category}</h3>
                <div className="skill-tags">
                  {skillGroup.items.map(skill => (
                    <span key={skill} className="skill-tag">{skill}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="about-experience-section">
          <h2>💼 {t('experience')}</h2>
          <div className="experience-timeline">
            {currentData.expList.map((exp, idx) => (
              <div key={idx} className="timeline-item border-box-style">
                <span className="timeline-period">{exp.period}</span>
                <h3 className="timeline-school">{exp.title}</h3>
                <p className="timeline-details">{exp.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
