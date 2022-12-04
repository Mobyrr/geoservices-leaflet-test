export class CourseResponse {
  public duration!: number;
  public start!: string;
  public end!: string;
  public distance!: string;
  public portions!: [
    {
      steps: [
        {
          geometry: string;
          attributes: {
            name: {
              nom_1_gauche: string;
              nom_1_droite: string;
              cpx_numero: string;
              cpx_toponyme_route_nommee: string;
            };
            cleabs: string;
          };
          distance: number;
          duration: number;
          instruction: {
            type: string;
            modifier: string | undefined;
          };
        }
      ];
    }
  ];
  public geometry!: string;
}
