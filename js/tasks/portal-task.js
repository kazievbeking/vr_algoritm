export function edgeCost(graph,a,b) {return graph.edges.find(([u,v])=>(u===a&&v===b)||(u===b&&v===a))?.[2] ?? Infinity;}
export function routeCost(graph,route) {let cost=0;for(let i=1;i<route.length;i++) cost+=edgeCost(graph,route[i-1],route[i]);return cost;}
export function shortestPath(graph,start='S',goal='P') {
  const distances=Object.fromEntries(Object.keys(graph.nodes).map(n=>[n,Infinity])); const previous={};const open=new Set(Object.keys(graph.nodes));distances[start]=0;
  while(open.size) {
    const current=[...open].sort((a,b)=>distances[a]-distances[b])[0];
    if(distances[current]===Infinity) break;
    open.delete(current);if(current===goal) break;
    for(const [a,b,cost] of graph.edges) {
      const next=a===current?b:b===current?a:null;
      if(next&&open.has(next)&&distances[current]+cost<distances[next]) {distances[next]=distances[current]+cost;previous[next]=current;}
    }
  }
  const path=[];if(Number.isFinite(distances[goal])) for(let n=goal;n;n=previous[n]) path.unshift(n);
  return {cost:distances[goal],path};
}
export function routeResult(graph,route) {
  const cost=routeCost(graph,route), optimal=shortestPath(graph).cost;
  return {cost,optimal,success:route[0]==='S'&&route.at(-1)==='P'&&cost<=graph.budget,efficient:cost===optimal};
}
