export default function ScoreMeter({ score }) {

  const color =
    score > 75 ? "green" :
    score > 50 ? "orange" :
    "red";

  return (
    <div>
      <h3>Score: {score}</h3>

      <div style={{
        width:"100%",
        background:"#eee",
        borderRadius:"10px"
      }}>
        <div style={{
          width:`${score}%`,
          height:"12px",
          borderRadius:"10px",
          background:color
        }} />
      </div>
    </div>
  );
}
