from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.cluster import AgglomerativeClustering
from typing import List, Dict, Any
from app.models import Question

class ClusterService:
    def group_questions(self, questions: List[Question]) -> List[Dict[str, Any]]:
        if not questions:
            return []

        messages = [q.message for q in questions]

        if len(messages) < 2:
            return [{
                "title": messages[0],
                "questions": questions
            }]

        try:
            
            vectorizer = TfidfVectorizer(stop_words='english')
            tfidf_matrix = vectorizer.fit_transform(messages)

            clustering = AgglomerativeClustering(
                n_clusters=None,
                distance_threshold=0.6,
                metric='cosine',
                linkage='average'
            )
            labels = clustering.fit_predict(tfidf_matrix.toarray())


            groups = {}
            for idx, label in enumerate(labels):
                if label not in groups:
                    groups[label] = []
                groups[label].append(questions[idx])

            result = []
            for label, group_questions in groups.items():
                title = group_questions[0].message
                result.append({
                    "title": title,
                    "questions": group_questions,
                    "count": len(group_questions)
                })
            

            result.sort(key=lambda x: x['count'], reverse=True)
            
            return result

        except Exception as e:
            print(f"Error in clustering: {e}")
            return [{"title": q.message, "questions": [q], "count": 1} for q in questions] 
