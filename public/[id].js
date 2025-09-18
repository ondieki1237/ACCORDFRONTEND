export default function RequestDetailPage({}) {
  return <h1>Request Detail</h1>
}

export async function getStaticPaths() {
  return {
    paths: [], // Add your pre-rendered paths here
    fallback: false,
  }
}

export async function getStaticProps({ params }) {
  return { props: {} }
}