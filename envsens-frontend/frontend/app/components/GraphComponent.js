// /path/to/PollutantGraph.js

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import axios from '@/app/axiosConfig';
import { Toast } from 'primereact/toast';
import { useSelector } from 'react-redux';
import Comments from './comment';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

const PollutantGraph = ({ width }) => {
  const [data, setData] = useState(null);
  const [pollutantRanges, setPollutantRanges] = useState({});
  const toast = useRef(null);

  useEffect(() => {
    const getData = async () => {
      try {
        const response = await axios.get('/pollutant-records/');
        const organizedData = {};
        const pollutantIds = new Set();

        response.data.forEach((record) => {
          pollutantIds.add(record.pollutant_id);
          if (!organizedData[record.pollutant_id]) {
            organizedData[record.pollutant_id] = [{
              x: new Date(record.timestamp_device).toLocaleString(),
              y: record.value,
              name: record.name
            }];
          } else {
            organizedData[record.pollutant_id].push({
              x: new Date(record.timestamp_device).toLocaleString(),
              y: record.value,
            });
          }
        });

        setData(organizedData);

        const pollutantRanges = {};
        await Promise.all(Array.from(pollutantIds).map(async (pollutantId) => {
          const rangeResponse = await axios.get(`/admins/pollutants/list_polluant_range/${pollutantId}/`);
          pollutantRanges[pollutantId] = rangeResponse.data.ranges;
        }));
        setPollutantRanges(pollutantRanges);

      } catch (error) {
        console.log(error);
        toast.current.show({ severity: 'error', summary: 'Erreur', detail: 'Une erreur est survenue lors de la récupération des données', life: 3000 });
      }
    };

    getData();
  }, []);

  const getColorForValue = (pollutantId, value) => {
    const ranges = pollutantRanges[pollutantId];
    console.log(ranges);
    if (!ranges) return '#000000'; // Default color if no ranges are found

    for (let range of ranges) {
      if (!range.isMaxValueInclude) {
        if (value >= range.minValue && value < range.maxValue) {
          return range.display_color;
        }
      } else {
        if (value >= range.minValue && value < range.maxValue) {
          return range.display_color;
        }
      }
    }
    return '#000000'; // Default color if no range matches
  };

  const getQualityLabel = (pollutantId, value) => {
    const ranges = pollutantRanges[pollutantId];
    if (!ranges) return 'N/A'; // Default label if no ranges are found

    for (let range of ranges) {
      if (value >= range.minValue && (range.isMaxValueInclude ? value <= range.maxValue : value < range.maxValue)) {
        return range.quality || 'N/A';
      }
    }
    return 'N/A'; // Default label if no range matches
  };

  return (
    <div>
      <Toast ref={toast} />
      {data && Object.keys(data).map((pollutantId) => (
        <div key={pollutantId} style={{ marginBottom: '2rem' }}>
          <h3>Pollutant ID: {data[pollutantId][0].name}</h3>
          <Chart //style={{width:`${width}vw`}}
            options={{
              chart: {
                type: 'area',
                height: '100%',
                width: '100%',
              },
              xaxis: {
                type: 'datetime',
              },
              yaxis: {
                title: {
                  text: 'Value',
                },
              },
              annotations: {
                points: data[pollutantId].map((point) => ({
                  x: point.x,
                  y: point.y,
                  marker: {
                    size: 5,
                    fillColor: getColorForValue(pollutantId, point.y),
                    strokeColor: getColorForValue(pollutantId, point.y),
                  },
                  label: {
                    borderColor: getColorForValue(pollutantId, point.y),
                    style: {
                      color: '#fff',
                      background: getColorForValue(pollutantId, point.y),
                    },
                    text: `Quality: ${getQualityLabel(pollutantId, point.y)}`,
                  }
                })),
              },
              stroke: {
                curve: 'smooth',
              },
              title: {
                text: `Pollutant ID: ${pollutantId}`,
              },
            }}
            series={[{
              name: `Pollutant ${pollutantId}`,
              data: data[pollutantId],
            }]}
            type="area"
            height={350}
            width={width}
          />
          <hr />
          <h3> Commentaires sur ce polluant:</h3>
          <Comments recordId={pollutantId} />
        </div>
      ))}
    </div>
  );
};

export default PollutantGraph;
